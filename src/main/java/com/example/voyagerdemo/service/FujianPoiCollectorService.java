package com.example.voyagerdemo.service;

import com.example.voyagerdemo.dto.AmapPOI;
import com.example.voyagerdemo.dto.CollectionStatusResponse;
import com.example.voyagerdemo.dto.StatisticsResponse;
import com.example.voyagerdemo.entity.Poi;
import com.example.voyagerdemo.entity.Region;
import com.example.voyagerdemo.repository.PoiRepository;
import com.example.voyagerdemo.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FujianPoiCollectorService {
    
    private final RegionRepository regionRepository;
    private final PoiRepository poiRepository;
    private final AmapService amapService;
    
    private static final String PROVINCE = "福建省";
    
    private static final int POIS_PER_TYPE = 6; // 每种类型保存6个
    private static final int API_DELAY_MS = 200; // API调用间隔
    private static final int MAX_RETRIES = 3; // 最大重试次数
    
    // 采集状态跟踪
    private final Map<String, String> collectionStatus = new ConcurrentHashMap<>();
    private volatile String currentStatus = "idle";
    private volatile String currentCity = "";
    private volatile int completedCities = 0;
    private volatile int totalPois = 0;
    private volatile LocalDateTime startTime;
    private volatile String errorMessage = "";
    
    // POI类型映射
    private static final Map<String, String> TYPE_KEYWORDS = Map.of(
        "hotel", "酒店",
        "attraction", "景点",
        "restaurant", "美食"
    );
    
    private static final Map<String, String> TYPE_CODES = Map.of(
        "hotel", "100000",
        "attraction", "110000",
        "restaurant", "050000"
    );
    
    // 需要过滤的关键词
    private static final Set<String> FILTER_KEYWORDS = Set.of(
        "停车场", "北门", "南门", "东门", "西门",
        "入口", "出口", "售票处", "游客中心"
    );
    
    /**
     * 从数据库获取福建省的城市列表
     */
    private List<String> getFujianCities() {
        return regionRepository.findAll().stream()
            .filter(r -> r.getCity() != null) // 只要城市，不要省级数据
            .map(Region::getCity)
            .collect(Collectors.toList());
    }
    

    
    /**
     * 异步采集所有城市POI
     */
    @Async
    public void collectAllPoisAsync() {
        log.info("开始异步采集所有城市POI");
        
        // 从数据库获取城市列表
        List<String> cities = getFujianCities();
        
        if (cities.isEmpty()) {
            log.error("数据库中没有城市数据，请先执行初始化");
            currentStatus = "failed";
            errorMessage = "数据库中没有城市数据，请先执行初始化";
            return;
        }
        
        log.info("从数据库获取到 {} 个城市", cities.size());
        
        currentStatus = "running";
        startTime = LocalDateTime.now();
        completedCities = 0;
        totalPois = 0;
        errorMessage = "";
        collectionStatus.clear();
        
        try {
            for (String city : cities) {
                currentCity = city;
                collectionStatus.put(city, "processing");
                
                try {
                    int cityPois = collectCityPois(city);
                    collectionStatus.put(city, "completed");
                    completedCities++;
                    totalPois += cityPois;
                    log.info("城市 {} 采集完成，共 {} 个POI", city, cityPois);
                    
                } catch (Exception e) {
                    log.error("城市 {} 采集失败", city, e);
                    collectionStatus.put(city, "failed: " + e.getMessage());
                }
            }
            
            currentStatus = "completed";
            log.info("所有城市采集完成，共采集 {} 个POI", totalPois);
            
        } catch (Exception e) {
            currentStatus = "failed";
            errorMessage = e.getMessage();
            log.error("采集过程发生错误", e);
        }
    }
    
    /**
     * 采集指定城市的POI
     */
    @Transactional
    public int collectCityPois(String cityName) {
        log.info("开始采集城市: {}", cityName);
        
        // 获取region_id
        Region region = regionRepository.findByCity(cityName)
            .orElseThrow(() -> new RuntimeException("城市不存在: " + cityName));
        
        int totalCollected = 0;
        
        // 采集三种类型的POI
        for (String type : TYPE_KEYWORDS.keySet()) {
            try {
                int count = collectPoiByType(region.getId(), cityName, type);
                totalCollected += count;
                log.info("城市 {} 类型 {} 采集完成，共 {} 个", cityName, type, count);
                
                // API调用间隔
                Thread.sleep(API_DELAY_MS);
                
            } catch (Exception e) {
                log.error("采集城市 {} 类型 {} 失败", cityName, type, e);
            }
        }
        
        return totalCollected;
    }
    
    /**
     * 按类型采集POI
     */
    private int collectPoiByType(Long regionId, String cityName, String type) {
        log.info("采集 {} - {}", cityName, type);
        
        List<AmapPOI> allPois = new ArrayList<>();
        
        // 调用高德API获取POI（2页）
        for (int page = 1; page <= 1; page++) {
            try {
                List<AmapPOI> pagePois = callAmapApiWithRetry(cityName, type, page);
                allPois.addAll(pagePois);
                
                if (page < 2) {
                    Thread.sleep(API_DELAY_MS);
                }
                
            } catch (Exception e) {
                log.error("调用高德API失败: city={}, type={}, page={}", cityName, type, page, e);
            }
        }
        
        // 过滤、排序并保存
        return filterAndSavePois(regionId, allPois, type);
    }
    
    /**
     * 带重试的高德API调用
     */
    private List<AmapPOI> callAmapApiWithRetry(String cityName, String type, int page) {
        int retries = 0;
        Exception lastException = null;
        
        while (retries < MAX_RETRIES) {
            try {
                String keyword = TYPE_KEYWORDS.get(type);
                return amapService.searchPOIsByKeyword(keyword, cityName, page, 25);
                
            } catch (Exception e) {
                lastException = e;
                retries++;
                if (retries < MAX_RETRIES) {
                    try {
                        Thread.sleep((long) Math.pow(2, retries) * 1000); // 指数退避
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }
        
        log.error("高德API调用失败，已重试 {} 次", MAX_RETRIES, lastException);
        return Collections.emptyList();
    }
    
    /**
     * 过滤并保存POI
     */
    private int filterAndSavePois(Long regionId, List<AmapPOI> poiList, String type) {
        if (poiList.isEmpty()) {
            return 0;
        }
        
        // 1. 过滤子POI
        List<AmapPOI> filtered = poiList.stream()
            .filter(poi -> !containsFilterKeyword(poi.getName()))
            .collect(Collectors.toList());
        
        // 2. 去重（基于高德ID）
        Map<String, AmapPOI> uniquePois = new LinkedHashMap<>();
        for (AmapPOI poi : filtered) {
            if (!uniquePois.containsKey(poi.getId())) {
                uniquePois.put(poi.getId(), poi);
            }
        }
        
        // 3. 质量排序
        List<AmapPOI> sortedPois = uniquePois.values().stream()
            .sorted((p1, p2) -> {
                // 优先级1: 评分
                int ratingCompare = compareRating(p2, p1);
                if (ratingCompare != 0) return ratingCompare;
                
                // 优先级2: 有图片
                int photoCompare = Boolean.compare(hasPhotos(p2), hasPhotos(p1));
                if (photoCompare != 0) return photoCompare;
                
                // 优先级3: 有电话
                return Boolean.compare(hasTel(p2), hasTel(p1));
            })
            .limit(POIS_PER_TYPE) // 只取前6个
            .collect(Collectors.toList());
        
        // 4. 保存到数据库
        int savedCount = 0;
        for (AmapPOI amapPoi : sortedPois) {
            try {
                // 检查是否已存在
                if (poiRepository.existsByRegionIdAndAmapId(regionId, amapPoi.getId())) {
                    continue;
                }
                
                Poi poi = convertToPoi(regionId, amapPoi, type);
                poiRepository.save(poi);
                savedCount++;
                
            } catch (Exception e) {
                log.error("保存POI失败: {}", amapPoi.getName(), e);
            }
        }
        
        return savedCount;
    }
    
    /**
     * 检查是否包含过滤关键词
     */
    private boolean containsFilterKeyword(String name) {
        return FILTER_KEYWORDS.stream().anyMatch(name::contains);
    }
    
    /**
     * 比较评分
     */
    private int compareRating(AmapPOI p1, AmapPOI p2) {
        double r1 = parseRating(p1);
        double r2 = parseRating(p2);
        return Double.compare(r1, r2);
    }
    
    private double parseRating(AmapPOI poi) {
        if (poi.getRating() != null) {
            return poi.getRating();
        }
        return 0.0;
    }
    
    private boolean hasPhotos(AmapPOI poi) {
        return poi.getPhotos() != null && !poi.getPhotos().isEmpty();
    }
    
    private boolean hasTel(AmapPOI poi) {
        return poi.getTel() != null && !poi.getTel().isEmpty();
    }
    
    /**
     * 转换为Poi实体
     */
    private Poi convertToPoi(Long regionId, AmapPOI amapPoi, String type) {
        Poi poi = new Poi();
        poi.setRegionId(regionId);
        poi.setAmapId(amapPoi.getId());
        poi.setName(amapPoi.getName());
        poi.setType(type);
        poi.setAddress(amapPoi.getAddress());
        
        // 解析坐标
        String[] location = new String[]{
                String.valueOf(amapPoi.getLocation().getLng()),
                String.valueOf(amapPoi.getLocation().getLat())
        };
        poi.setLocationLng(new BigDecimal(location[0]));
        poi.setLocationLat(new BigDecimal(location[1]));
        
        // 评分
        if (amapPoi.getRating() != null) {
            poi.setRating(BigDecimal.valueOf(amapPoi.getRating()));
        }
        
        poi.setTel(amapPoi.getTel());
        poi.setAmapType(amapPoi.getType());
        
        // 酒店星级
        if (amapPoi.getStarLevel() != null && !amapPoi.getStarLevel().isEmpty()) {
            poi.setStarLevel(amapPoi.getStarLevel());
        }
        
        // 景点等级
        if (amapPoi.getLevel() != null && !amapPoi.getLevel().isEmpty()) {
            poi.setLevel(amapPoi.getLevel());
        }
        
        // 餐厅人均消费
        if (amapPoi.getCost() != null && !amapPoi.getCost().isEmpty()) {
            poi.setCost(amapPoi.getCost());
        }
        
        // 处理photos（转为JSON字符串）
        if (amapPoi.getPhotos() != null && !amapPoi.getPhotos().isEmpty()) {
            poi.setPhotos(String.join(",", amapPoi.getPhotos()));
        }
        
        return poi;
    }
    
    /**
     * 获取采集状态
     */
    public CollectionStatusResponse getCollectionStatus() {
        // 从数据库获取城市总数
        List<String> cities = getFujianCities();
        int totalCities = cities.isEmpty() ? 9 : cities.size(); // 如果数据库为空，默认9个
        
        CollectionStatusResponse response = new CollectionStatusResponse();
        response.setStatus(currentStatus);
        response.setTotalCities(totalCities);
        response.setCompletedCities(completedCities);
        response.setCurrentCity(currentCity);
        response.setTotalPois(totalPois);
        response.setCityStatus(new HashMap<>(collectionStatus));
        response.setErrorMessage(errorMessage);
        
        if (startTime != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            response.setStartTime(startTime.format(formatter));
            
            if ("running".equals(currentStatus) && completedCities > 0) {
                // 估算结束时间
                long elapsedMinutes = java.time.Duration.between(startTime, LocalDateTime.now()).toMinutes();
                long estimatedTotalMinutes = elapsedMinutes * totalCities / completedCities;
                LocalDateTime estimatedEnd = startTime.plusMinutes(estimatedTotalMinutes);
                response.setEstimatedEndTime(estimatedEnd.format(formatter));
            }
        }
        
        return response;
    }
    
    /**
     * 获取统计信息
     */
    public StatisticsResponse getStatistics() {
        List<Region> fujianRegions = regionRepository.findByProvince(PROVINCE);
        
        Map<String, Integer> poiByCity = new HashMap<>();
        Map<String, Integer> poiByType = new HashMap<>();
        int totalPois = 0;
        
        for (Region region : fujianRegions) {
            if (region.getCity() != null) {
                int count = poiRepository.countByRegionId(region.getId());
                poiByCity.put(region.getCity(), count);
                totalPois += count;
                
                // 统计各类型数量
                for (String type : TYPE_KEYWORDS.keySet()) {
                    int typeCount = poiRepository.findByRegionIdAndType(region.getId(), type).size();
                    poiByType.merge(type, typeCount, Integer::sum);
                }
            }
        }
        
        StatisticsResponse response = new StatisticsResponse();
        response.setTotalPois(totalPois);
        response.setPoiByCity(poiByCity);
        response.setPoiByType(poiByType);
        response.setLastUpdateTime(LocalDateTime.now().format(
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        return response;
    }
    
    /**
     * 清空福建省POI数据
     */
    @Transactional
    public String clearFujianPois() {
        log.info("开始清空POI数据");

        try {
            poiRepository.deleteByProvince(PROVINCE);
            log.info("POI数据已清空");
            return "POI数据已清空";
            
        } catch (Exception e) {
            log.error("清空POI数据失败", e);
            throw new RuntimeException("清空失败: " + e.getMessage());
        }
    }
}
