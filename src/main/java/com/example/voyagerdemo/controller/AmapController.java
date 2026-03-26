package com.example.voyagerdemo.controller;

import com.example.voyagerdemo.dto.AmapPOI;
import com.example.voyagerdemo.dto.AmapSearchSuggestion;
import com.example.voyagerdemo.dto.SearchAllResponse;
import com.example.voyagerdemo.service.AmapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/amap")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${cors.allowed-origins}")
public class AmapController {
    
    private final AmapService amapService;
    
    /**
     * 获取搜索建议
     */
    @GetMapping("/suggestions")
    public ResponseEntity<List<AmapSearchSuggestion>> getSearchSuggestions(
            @RequestParam String keyword) {
        try {
            List<AmapSearchSuggestion> suggestions = amapService.getSearchSuggestions(keyword);
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            log.error("获取搜索建议失败: {}", keyword, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * POI搜索
     */
    @GetMapping("/search")
    public ResponseEntity<List<AmapPOI>> searchPOI(
            @RequestParam String keyword,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String types) {
        try {
            // 根据前端需求映射POI类型
            String mappedTypes = mapPOITypes(types);
            List<AmapPOI> pois = amapService.searchPOI(keyword, city, mappedTypes);
            return ResponseEntity.ok(pois);
        } catch (Exception e) {
            log.error("POI搜索失败: {}", keyword, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 周边搜索
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<AmapPOI>> getNearbyPOI(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam String types,
            @RequestParam(defaultValue = "3000") Integer radius) {
        try {
            String mappedTypes = mapPOITypes(types);
            List<AmapPOI> pois = amapService.getNearbyPOI(lat, lng, mappedTypes, radius);
            return ResponseEntity.ok(pois);
        } catch (Exception e) {
            log.error("周边搜索失败: lat={}, lng={}", lat, lng, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 关键词搜索 - 一次返回三类数据
     */
    @GetMapping("/search-all")
    public ResponseEntity<SearchAllResponse> searchAll(
            @RequestParam String keyword,
            @RequestParam(required = false) String city) {
        try {
            log.info("收到搜索全部类型请求 - keyword: {}, city: {}", keyword, city);
            
            SearchAllResponse response = new SearchAllResponse();
            
            // 并行搜索三类POI
            log.info("开始搜索酒店...");
            List<AmapPOI> hotels = amapService.searchPOI(keyword, city, "100000");
            log.info("酒店搜索完成，找到 {} 个结果", hotels.size());
            
            log.info("开始搜索景点...");
            List<AmapPOI> attractions = amapService.searchPOI(keyword, city, "110000");
            log.info("景点搜索完成，找到 {} 个结果", attractions.size());
            
            log.info("开始搜索餐厅...");
            List<AmapPOI> restaurants = amapService.searchPOI(keyword, city, "050000");
            log.info("餐厅搜索完成，找到 {} 个结果", restaurants.size());
            
            response.setHotels(hotels);
            response.setAttractions(attractions);
            response.setRestaurants(restaurants);
            
            log.info("搜索全部类型完成 - 酒店:{}, 景点:{}, 餐厅:{}", 
                    hotels.size(), attractions.size(), restaurants.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("搜索全部类型失败: {}", keyword, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 周边搜索 - 一次返回三类数据（距离是相对于目标地的距离）
     */
    @GetMapping("/nearby-all")
    public ResponseEntity<SearchAllResponse> getNearbyAll(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(defaultValue = "3000") Integer radius) {
        try {
            log.info("收到周边搜索全部类型请求 - 目标地: ({}, {}), 半径: {}米", lat, lng, radius);
            
            SearchAllResponse response = new SearchAllResponse();
            
            // 并行搜索三类POI（周边搜索API会自动返回距离目标地的距离）
            log.info("开始搜索周边酒店...");
            List<AmapPOI> hotels = amapService.getNearbyPOI(lat, lng, "100000", radius);
            log.info("周边酒店搜索完成，找到 {} 个结果", hotels.size());
            
            log.info("开始搜索周边景点...");
            List<AmapPOI> attractions = amapService.getNearbyPOI(lat, lng, "110000", radius);
            log.info("周边景点搜索完成，找到 {} 个结果", attractions.size());
            
            log.info("开始搜索周边餐厅...");
            List<AmapPOI> restaurants = amapService.getNearbyPOI(lat, lng, "050000", radius);
            log.info("周边餐厅搜索完成，找到 {} 个结果", restaurants.size());
            
            response.setHotels(hotels);
            response.setAttractions(attractions);
            response.setRestaurants(restaurants);
            
            log.info("周边搜索全部类型完成 - 酒店:{}, 景点:{}, 餐厅:{}", 
                    hotels.size(), attractions.size(), restaurants.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("周边搜索全部类型失败: lat={}, lng={}", lat, lng, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 测试高德API连接
     */
    @GetMapping("/test")
    public ResponseEntity<String> testAmapAPI(@RequestParam(defaultValue = "酒店") String keyword) {
        try {
            log.info("测试高德API - keyword: {}", keyword);
            
            // 测试搜索建议
            List<AmapSearchSuggestion> suggestions = amapService.getSearchSuggestions(keyword);
            log.info("搜索建议结果: {} 条", suggestions.size());
            
            // 测试POI搜索
            List<AmapPOI> pois = amapService.searchPOI(keyword, "北京", "");
            log.info("POI搜索结果: {} 条", pois.size());
            
            return ResponseEntity.ok(String.format(
                    "测试成功！\n搜索建议: %d 条\nPOI搜索: %d 条\n第一个建议: %s",
                    suggestions.size(),
                    pois.size(),
                    suggestions.isEmpty() ? "无" : suggestions.get(0).getName()
            ));
        } catch (Exception e) {
            log.error("测试失败", e);
            return ResponseEntity.ok("测试失败: " + e.getMessage());
        }
    }
    
    /**
     * 映射前端POI类型到高德地图类型码
     */
    private String mapPOITypes(String frontendType) {
        if (frontendType == null) {
            return "";
        }
        
        return switch (frontendType.toLowerCase()) {
            case "hotel", "酒店" -> "100000"; // 住宿服务
            case "attraction", "景点" -> "110000"; // 风景名胜
            case "restaurant", "餐厅" -> "050000"; // 餐饮服务
            default -> "";
        };
    }
}