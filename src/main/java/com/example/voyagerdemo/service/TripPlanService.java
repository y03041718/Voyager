package com.example.voyagerdemo.service;

import com.example.voyagerdemo.dto.TripPlanRequest;
import com.example.voyagerdemo.dto.TravelPlanResponse;

import com.example.voyagerdemo.entity.User;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

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

    /**
     * 生成旅行计划
     */
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

        log.info("旅行计划生成完成，共{}天", response.getDays().size());
        return response;
    }


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
                请为我制定一份旅行计划，必须严格按照JSON格式输出，不要添加任何其他文字。

                【用户参数】
                - city: %s
                - days: %s
                - preference: %s + %s
                - startDate: %s

                【必选POI】（必须全部包含在行程中）
                %s
                【可选POI】（可以从中选择合适的加入行程）
                %s

                【输出要求】
                1. 必须包含所有【必选POI】
                2. 可以从【可选POI】中选择合适的地点补充
                3. 餐厅选择：一天吃午餐和晚餐
                4. 根据旅行风格（%s）合理安排节奏：【特种兵】可以多安排景点、【慢旅行】可以多选择自然景点、【美食家】可以在两餐之外多选餐厅吃早餐/夜宵、【艺术控】可以多选择人文景点
                5. 考虑景点之间的距离和游览顺序
                6. 酒店类型的POI只在plans中标注，不需要详细安排时间
                7. 为每天生成合理的天气信息（温度、天气状况、体感温度）
                8. 为每天生成当地特色与提示（文化特色、美食特色、旅行提示）
                9. 严格按照以下JSON格式输出，id字段必须使用POI列表中的id：

                ```json
                {
                  "days": [
                    {
                      "day": 1,
                      "date": "%s",
                      "weather": {
                        "temperature": "24",
                        "condition": "晴朗",
                        "feelsLike": "26"
                      },
                      "localTips": {
                        "culture": "当地的文化特色描述，100字左右",
                        "food": "当地饮食偏好、特色菜品，100字左右",
                        "tips": "当地当季天气特色、建议穿的衣物和携带物品，100字左右"
                      },
                      "plans": [
                        {
                          "time": "09:00",
                          "type": "attraction",
                          "id": "POI的id",
                          "name": "POI名称",
                          "desc": "简短描述和建议",
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
                request.getTravelers(),       // travelers
                request.getStyle(),           // style
                request.getStartDate(),       // startDate
                selectedPoiStr,               // 必选POI
                availablePoiStr,              // 可选POI
                request.getStyle(),           // 输出要求里的style
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
}
