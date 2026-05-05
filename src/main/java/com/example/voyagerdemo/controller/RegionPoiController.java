package com.example.voyagerdemo.controller;

import com.example.voyagerdemo.entity.Poi;
import com.example.voyagerdemo.entity.Region;
import com.example.voyagerdemo.repository.PoiRepository;
import com.example.voyagerdemo.repository.RegionRepository;
import com.example.voyagerdemo.service.SearchStatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/region-poi")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class RegionPoiController {

    private final RegionRepository regionRepository;
    private final PoiRepository poiRepository;
    private final SearchStatService searchStatService;

    /**
     * 获取所有省份列表
     */
    @GetMapping("/provinces")
    public ResponseEntity<?> getProvinces() {
        try {
            List<Region> provinces = regionRepository.findAll().stream()
                    .filter(r -> r.getCity() == null)
                    .collect(Collectors.toList());

            List<Map<String, Object>> result = provinces.stream()
                    .map(p -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", p.getId());
                        map.put("province", p.getProvince());
                        map.put("displayName", p.getDisplayName());
                        return map;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取省份列表失败", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 获取指定省份的城市列表
     */
    @GetMapping("/cities")
    public ResponseEntity<?> getCities(@RequestParam String province) {
        try {
            List<Region> cities = regionRepository.findByProvince(province).stream()
                    .filter(r -> r.getCity() != null)
                    .collect(Collectors.toList());

            List<Map<String, Object>> result = cities.stream()
                    .map(c -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", c.getId());
                        map.put("city", c.getCity());
                        map.put("displayName", c.getDisplayName());

                        // 统计该城市的POI数量
                        int poiCount = poiRepository.countByRegionId(c.getId());
                        map.put("poiCount", poiCount);

                        return map;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取城市列表失败: province={}", province, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 获取指定城市的POI列表
     * 添加省市搜索统计
     */
    @GetMapping("/pois")
    public ResponseEntity<?> getCityPois(
            @RequestParam String province,
            @RequestParam String city,
            @RequestParam(required = false) String type) {
        try {
            // 记录省市搜索统计
            searchStatService.recordProvinceSearch(province, city);

            Region region = regionRepository.findByProvinceAndCity(province, city)
                    .orElseThrow(() -> new RuntimeException("城市不存在"));

            List<Poi> pois;
            if (type != null && !type.isEmpty()) {
                pois = poiRepository.findByRegionIdAndType(region.getId(), type);
            } else {
                pois = poiRepository.findByRegionId(region.getId());
            }

            List<Map<String, Object>> result = pois.stream()
                    .map(poi -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", poi.getId());
                        map.put("amapId", poi.getAmapId());
                        map.put("name", poi.getName());
                        map.put("type", poi.getType());
                        map.put("address", poi.getAddress());
                        map.put("locationLat", poi.getLocationLat());
                        map.put("locationLng", poi.getLocationLng());
                        map.put("rating", poi.getRating());
                        map.put("tel", poi.getTel());
                        map.put("starLevel", poi.getStarLevel());
                        map.put("level", poi.getLevel());
                        map.put("cost", poi.getCost());
                        map.put("amapType", poi.getAmapType());

                        // 处理photos
                        if (poi.getPhotos() != null && !poi.getPhotos().isEmpty()) {
                            map.put("photos", List.of(poi.getPhotos().split(",")));
                        } else {
                            map.put("photos", List.of());
                        }

                        return map;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取城市POI失败: province={}, city={}, type={}", province, city, type, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
