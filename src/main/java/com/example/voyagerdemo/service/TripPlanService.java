package com.example.voyagerdemo.service;

import com.example.voyagerdemo.dto.*;
import com.example.voyagerdemo.entity.TripPlan;
import com.example.voyagerdemo.entity.TripPlanShare;
import com.example.voyagerdemo.entity.User;
import com.example.voyagerdemo.repository.TripPlanRepository;
import com.example.voyagerdemo.repository.TripPlanShareRepository;
import com.example.voyagerdemo.repository.TeamMemberRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TripPlanService {

    private final QwenService qwenService;
    private final ObjectMapper objectMapper;
    private final UserService userService;
    private final TripPlanRepository tripPlanRepository;
    private final TripPlanShareRepository tripPlanShareRepository;
    private final TeamMemberRepository teamMemberRepository;

    /**
     * 生成旅行计划（并自动保存到数据库）
     */
    @Transactional
    public TravelPlanResponse generateTravelPlan(TripPlanRequest request) {
        log.info("开始生成旅行计划: destination={}, dates={} to {}",
                request.getDestination(), request.getStartDate(), request.getEndDate());

        // 1. 构建POI映射表（ID -> POI对象）
        Map<String, TripPlanRequest.SelectedPlace> poiMap = new HashMap<>();
        if (request.getSelectedPlaces() != null) {
            request.getSelectedPlaces().forEach(p -> poiMap.put(p.getId(), p));
        }
        if (request.getAvailablePlaces() != null) {
            request.getAvailablePlaces().forEach(p -> poiMap.put(p.getId(), p));
        }

        // 2. 构建优化的prompt
        String prompt = buildPrompt(request);

        // 3. 调用Qwen API生成JSON
        String aiResponse = qwenService.generateTravelPlan(prompt);

        // 4. 清洗JSON
        String cleanedJson = qwenService.cleanJson(aiResponse);
        log.debug("清洗后的JSON: {}", cleanedJson);

        // 5. 解析AI返回的JSON
        TravelPlanResponse response;
        try {
            response = objectMapper.readValue(cleanedJson, TravelPlanResponse.class);
        } catch (Exception e) {
            log.error("解析AI返回的JSON失败: {}", cleanedJson, e);
            throw new RuntimeException("解析AI响应失败: " + e.getMessage());
        }

        // 6. 设置目的地城市名
        response.setDestination(request.getDestination());
        log.info("设置目的地城市名: {}", request.getDestination());

        // 7. 填充POI完整信息
        enrichWithPoiData(response, poiMap);

        // 8. 自动保存到数据库
        try {
            saveTravelPlan(request, response);
            log.info("✅ 旅行计划已自动保存到数据库");
        } catch (Exception e) {
            log.error("❌ 保存旅行计划失败，但仍返回生成的计划", e);
            // 不抛出异常，允许用户看到生成的计划
        }

        log.info("旅行计划生成完成，共{}天", response.getDays().size());
        return response;
    }

    /**
     * 保存旅行计划到数据库
     */
    @Transactional
    public TripPlan saveTravelPlan(TripPlanRequest request, TravelPlanResponse travelPlan) {
        // 获取当前用户
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findByUsername(auth.getName());

        // 创建实体
        TripPlan tripPlan = new TripPlan();
        tripPlan.setUserId(user.getId());
        tripPlan.setTitle(travelPlan.getTitle());
        tripPlan.setDestination(request.getDestination());
        tripPlan.setStartDate(LocalDate.parse(request.getStartDate()));
        tripPlan.setEndDate(LocalDate.parse(request.getEndDate()));
        tripPlan.setTravelers(request.getTravelers());
        tripPlan.setStyle(request.getStyle());

        // 将完整的TravelPlanResponse转为JSON字符串
        try {
            String planDataJson = objectMapper.writeValueAsString(travelPlan);
            tripPlan.setPlanData(planDataJson);
        } catch (Exception e) {
            log.error("序列化行程数据失败", e);
            throw new RuntimeException("保存行程失败: " + e.getMessage());
        }

        // 提取封面图（第一张图片）
        String coverImage = extractCoverImage(travelPlan);
        tripPlan.setCoverImage(coverImage);

        // 保存
        TripPlan saved = tripPlanRepository.save(tripPlan);
        log.info("行程已保存: id={}, title={}", saved.getId(), saved.getTitle());

        return saved;
    }

    /**
     * 查询用户的所有行程
     */
    public List<TripPlanSummary> getMyTripPlans() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findByUsername(auth.getName());

        List<TripPlan> plans = tripPlanRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(user.getId());

        return plans.stream().map(this::toSummary).collect(Collectors.toList());
    }

    /**
     * 查询用户可见的所有行程（我的 + 团队分享的）
     */
    public List<TripPlanSummary> getVisibleTripPlans() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findByUsername(auth.getName());

        List<TripPlan> plans = tripPlanRepository.findVisibleTripPlans(user.getId());

        return plans.stream().map(plan -> {
            TripPlanSummary summary = toSummary(plan);
            summary.setIsOwner(plan.getUserId().equals(user.getId()));
            return summary;
        }).collect(Collectors.toList());
    }

    /**
     * 查询行程详情
     */
    public TripPlanResponse getTripPlanDetail(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findByUsername(auth.getName());

        // 查询行程（需要是自己的或团队分享的）
        TripPlan tripPlan = tripPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("行程不存在"));

        // 权限检查：是创建者 或 在分享的团队中
        if (!tripPlan.getUserId().equals(user.getId())) {
            boolean hasAccess = tripPlanShareRepository.findByTripPlanId(id).stream()
                    .anyMatch(share -> teamMemberRepository.existsByTeamIdAndUserId(share.getTeamId(), user.getId()));

            if (!hasAccess) {
                throw new RuntimeException("无权访问此行程");
            }
        }

        return toResponse(tripPlan, user.getId());
    }

    /**
     * 更新行程
     */
    @Transactional
    public TripPlanResponse updateTripPlan(Long id, TripPlanRequest request, TravelPlanResponse travelPlan) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findByUsername(auth.getName());

        // 查询并检查权限
        TripPlan tripPlan = tripPlanRepository.findByIdAndUserIdAndIsActiveTrue(id, user.getId())
                .orElseThrow(() -> new RuntimeException("行程不存在或无权修改"));

        // 更新字段
        tripPlan.setTitle(travelPlan.getTitle());
        tripPlan.setDestination(request.getDestination());
        tripPlan.setStartDate(LocalDate.parse(request.getStartDate()));
        tripPlan.setEndDate(LocalDate.parse(request.getEndDate()));
        tripPlan.setTravelers(request.getTravelers());
        tripPlan.setStyle(request.getStyle());

        // 更新JSON数据
        try {
            String planDataJson = objectMapper.writeValueAsString(travelPlan);
            tripPlan.setPlanData(planDataJson);
        } catch (Exception e) {
            log.error("序列化行程数据失败", e);
            throw new RuntimeException("更新行程失败: " + e.getMessage());
        }

        // 更新封面图
        String coverImage = extractCoverImage(travelPlan);
        tripPlan.setCoverImage(coverImage);

        TripPlan updated = tripPlanRepository.save(tripPlan);
        log.info("行程已更新: id={}, title={}", updated.getId(), updated.getTitle());

        return toResponse(updated, user.getId());
    }

    /**
     * 删除行程（软删除）
     */
    @Transactional
    public void deleteTripPlan(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findByUsername(auth.getName());

        TripPlan tripPlan = tripPlanRepository.findByIdAndUserIdAndIsActiveTrue(id, user.getId())
                .orElseThrow(() -> new RuntimeException("行程不存在或无权删除"));

        tripPlan.setIsActive(false);
        tripPlanRepository.save(tripPlan);

        log.info("行程已删除: id={}, title={}", tripPlan.getId(), tripPlan.getTitle());
    }

    /**
     * 分享行程到团队
     */
    @Transactional
    public void shareTripPlan(Long tripPlanId, Long teamId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findByUsername(auth.getName());

        // 检查行程是否存在且属于当前用户
        TripPlan tripPlan = tripPlanRepository.findByIdAndUserIdAndIsActiveTrue(tripPlanId, user.getId())
                .orElseThrow(() -> new RuntimeException("行程不存在或无权分享"));

        // 检查用户是否在团队中
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, user.getId())) {
            throw new RuntimeException("您不在该团队中");
        }

        // 检查是否已分享
        if (tripPlanShareRepository.existsByTripPlanIdAndTeamId(tripPlanId, teamId)) {
            throw new RuntimeException("已经分享过此行程到该团队");
        }

        // 创建分享记录
        TripPlanShare share = new TripPlanShare();
        share.setTripPlanId(tripPlanId);
        share.setTeamId(teamId);
        share.setSharedBy(user.getId());

        tripPlanShareRepository.save(share);
        log.info("行程已分享: tripPlanId={}, teamId={}, sharedBy={}", tripPlanId, teamId, user.getId());
    }

    /**
     * 取消分享
     */
    @Transactional
    public void unshareTripPlan(Long tripPlanId, Long teamId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findByUsername(auth.getName());

        // 检查行程是否存在且属于当前用户
        TripPlan tripPlan = tripPlanRepository.findByIdAndUserIdAndIsActiveTrue(tripPlanId, user.getId())
                .orElseThrow(() -> new RuntimeException("行程不存在或无权操作"));

        tripPlanShareRepository.deleteByTripPlanIdAndTeamId(tripPlanId, teamId);
        log.info("已取消分享: tripPlanId={}, teamId={}", tripPlanId, teamId);
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 填充POI完整信息
     */
    private void enrichWithPoiData(TravelPlanResponse response, Map<String, TripPlanRequest.SelectedPlace> poiMap) {
        if (response.getDays() == null) {
            return;
        }

        int totalPlans = 0;
        int plansWithLocation = 0;

        log.info("📍 开始填充POI数据，POI映射表大小: {}", poiMap.size());

        for (TravelPlanResponse.DayPlan day : response.getDays()) {
            if (day.getPlans() == null) {
                continue;
            }

            for (TravelPlanResponse.Plan plan : day.getPlans()) {
                totalPlans++;

                // 如果AI返回了ID，从POI映射表中获取完整信息
                if (plan.getId() != null && poiMap.containsKey(plan.getId())) {
                    TripPlanRequest.SelectedPlace poi = poiMap.get(plan.getId());

                    log.debug("处理计划: name={}, id={}", plan.getName(), plan.getId());

                    plan.setImage(poi.getImage());
                    plan.setRating(poi.getRating());
                    plan.setAddress(poi.getAddress());
                    plan.setStarLevel(poi.getStarLevel());
                    plan.setLevel(poi.getLevel());
                    plan.setCost(poi.getCost());
                    plan.setTel(poi.getTel());

                    // ✅ 设置位置信息
                    if (poi.getLocation() != null && poi.getLocation().getLat() != null && poi.getLocation().getLng() != null) {
                        TravelPlanResponse.Location location = new TravelPlanResponse.Location();
                        location.setLat(poi.getLocation().getLat());
                        location.setLng(poi.getLocation().getLng());
                        plan.setLocation(location);
                        plansWithLocation++;
                        log.info("✅ 已设置位置信息: {} (lat={}, lng={})",
                                plan.getName(), location.getLat(), location.getLng());
                    } else {
                        log.warn("⚠️ POI没有位置信息: {} (id={})", poi.getName(), poi.getId());
                    }

                    // 如果AI没有返回name，使用POI的name
                    if (plan.getName() == null || plan.getName().isEmpty()) {
                        plan.setName(poi.getName());
                    }
                } else {
                    // 如果没有ID或找不到POI，生成默认图片
                    if (plan.getImage() == null) {
                        plan.setImage("https://picsum.photos/seed/" + plan.getName() + "/800/600");
                    }
                    log.warn("⚠️ 未找到POI数据: {} (id={})", plan.getName(), plan.getId());
                }
            }
        }

        log.info("📍 位置信息统计: {}/{} 个计划有位置信息", plansWithLocation, totalPlans);
    }

    /**
     * 构建优化的Prompt，强制输出JSON格式
     */
    private String buildPrompt(TripPlanRequest request) {

        // ========= 1. 计算天数 =========
        LocalDate startDate = LocalDate.parse(request.getStartDate());
        LocalDate endDate = LocalDate.parse(request.getEndDate());
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        // ========= 2. 按类型分组 =========
        List<TripPlanRequest.SelectedPlace> selectedHotels = filterByType(request.getSelectedPlaces(), "hotel");
        List<TripPlanRequest.SelectedPlace> selectedAttractions = filterByType(request.getSelectedPlaces(), "attraction");
        List<TripPlanRequest.SelectedPlace> selectedRestaurants = filterByType(request.getSelectedPlaces(), "restaurant");

        List<TripPlanRequest.SelectedPlace> availableHotels = filterByType(request.getAvailablePlaces(), "hotel");
        List<TripPlanRequest.SelectedPlace> availableAttractions = filterByType(request.getAvailablePlaces(), "attraction");
        List<TripPlanRequest.SelectedPlace> availableRestaurants = filterByType(request.getAvailablePlaces(), "restaurant");

        // ========= 3. 先构建POI字符串 =========
        String selectedPoiStr = buildPoiText("酒店", selectedHotels)
                + buildPoiText("景点", selectedAttractions)
                + buildPoiText("餐厅", selectedRestaurants);

        String availablePoiStr = buildPoiText("酒店", availableHotels)
                + buildPoiText("景点", availableAttractions)
                + buildPoiText("餐厅", availableRestaurants);

        // ========= 4. 模板 =========
        String template = """
                你是一位旅行规划专家，请根据已知信息制定一份旅行计划，必须严格按照JSON格式输出，不要添加任何其他文字。

                【用户参数】
                - city: %s
                - days: %s
                - startDate: %s

                【必选POI】（必须全部包含在行程中）
                %s
                【可选POI】（可以从中选择合适的加入行程）
                %s

                【输出要求】
                1. 必须包含所有【必选POI】，可以从【可选POI】中选择合适的地点补充
                2. 景点安排：默认每天两个
                3. 餐厅安排：默认每天【午餐 + 晚餐】两餐
                4. 根据旅行风格（%s）安排
                   - 特种兵：额外增加景点密度
                   - 慢旅行：优先选择自然景点
                   - 艺术控：优先选择人文景点
                   - 美食家：额外安排夜宵餐厅           
                6. 酒店安排：该类型POI每天只能安排一个
                7. 为每天生成合理的天气信息（温度、天气状况、体感温度）
                8. 根据城市(%s)和旅行风格（%s）生成当地特色与提示（文化特色、美食特色、旅行提示）
                9. 严格按照以下JSON格式输出，id字段必须使用POI列表中的id：

                ```json
                {
                   "title": "生成一个文艺、治愈的旅行计划标题，格式为：【城市：xxxx与xxxx】，类似「北海道：冬日雪国与温泉物语」"
                   "localTips": {
                      "culture": "当地的文化特色描述，100字左右",
                      "food": "当地饮食偏好、特色菜品，100字左右",
                      "tips": "当地当季天气特色、建议穿的衣物和携带物品，100字左右"
                   }
                  "days": [
                    {
                      "day": 1,
                      "date": "%s",
                      "weather": {
                        "temperature": "24",
                        "condition": "晴朗",
                        "feelsLike": "26"
                      },
                      "plans": [
                        {
                          "time": "09:00",
                          "type": "attraction",
                          "id": "POI的id",
                          "name": "POI名称",
                          "desc": "简短描述和建议（50字左右）",
                          "duration": "2小时"
                        },
                        {
                          "time": "入住",
                          "type": "hotel",
                          "id": "酒店POI的id",
                          "name": "酒店名称",
                          "desc": "入住酒店",
                          "duration": ""
                        }
                      ]
                    }
                  ]
                }
                ```
                """;
        // ========= 5. 填充变量 =========
        String finalPrompt = String.format(template,
                request.getDestination(),     // city
                days,                         // days
                request.getStartDate(),       // startDate
                selectedPoiStr,               // 必选POI
                availablePoiStr,              // 可选POI
                request.getStyle(),           // style
                request.getDestination(),     // city
                request.getStyle(),           // style
                startDate.toString()          // JSON里的date
        );

        log.debug("构建的Prompt:\n{}", finalPrompt);

        return finalPrompt;
    }

    /**
     * 按类型过滤POI
     */
    private List<TripPlanRequest.SelectedPlace> filterByType(List<TripPlanRequest.SelectedPlace> places, String type) {
        if (places == null) {
            return new ArrayList<>();
        }
        return places.stream()
                .filter(p -> type.equals(p.getType()))
                .collect(Collectors.toList());
    }

    /**
     * 添加POI列表到prompt
     */
    private String buildPoiText(String category, List<TripPlanRequest.SelectedPlace> pois) {
        if (pois == null || pois.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append(category).append(": ");

        for (int i = 0; i < pois.size(); i++) {
            TripPlanRequest.SelectedPlace poi = pois.get(i);
            sb.append(poi.getName()).append("(id:").append(poi.getId()).append(")");
            if (i < pois.size() - 1) {
                sb.append("、");
            }
        }
        sb.append("\n");

        return sb.toString();
    }

    /**
     * 提取封面图（第一张图片）
     */
    private String extractCoverImage(TravelPlanResponse travelPlan) {
        if (travelPlan.getDays() == null || travelPlan.getDays().isEmpty()) {
            return null;
        }

        for (TravelPlanResponse.DayPlan day : travelPlan.getDays()) {
            if (day.getPlans() != null) {
                for (TravelPlanResponse.Plan plan : day.getPlans()) {
                    if (plan.getImage() != null && !plan.getImage().isEmpty()) {
                        return plan.getImage();
                    }
                }
            }
        }

        return null;
    }

    /**
     * 转换为摘要DTO
     */
    private TripPlanSummary toSummary(TripPlan tripPlan) {
        TripPlanSummary summary = new TripPlanSummary();
        summary.setId(tripPlan.getId());
        summary.setTitle(tripPlan.getTitle());
        summary.setDestination(tripPlan.getDestination());
        summary.setStartDate(tripPlan.getStartDate());
        summary.setEndDate(tripPlan.getEndDate());
        summary.setTravelers(tripPlan.getTravelers());
        summary.setStyle(tripPlan.getStyle());
        summary.setCoverImage(tripPlan.getCoverImage());
        summary.setCreatedAt(tripPlan.getCreatedAt());
        summary.setIsOwner(true);  // 默认true，调用方可以覆盖
        return summary;
    }

    /**
     * 转换为详情DTO
     */
    private TripPlanResponse toResponse(TripPlan tripPlan, Long currentUserId) {
        TripPlanResponse response = new TripPlanResponse();
        response.setId(tripPlan.getId());
        response.setUserId(tripPlan.getUserId());
        response.setTitle(tripPlan.getTitle());
        response.setDestination(tripPlan.getDestination());
        response.setStartDate(tripPlan.getStartDate());
        response.setEndDate(tripPlan.getEndDate());
        response.setTravelers(tripPlan.getTravelers());
        response.setStyle(tripPlan.getStyle());
        response.setPlanData(tripPlan.getPlanData());
        response.setCoverImage(tripPlan.getCoverImage());
        response.setCreatedAt(tripPlan.getCreatedAt());
        response.setUpdatedAt(tripPlan.getUpdatedAt());
        response.setIsOwner(tripPlan.getUserId().equals(currentUserId));
        return response;
    }
}
