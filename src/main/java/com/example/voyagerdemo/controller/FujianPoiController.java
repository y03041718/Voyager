package com.example.voyagerdemo.controller;

import com.example.voyagerdemo.dto.CollectionStatusResponse;
import com.example.voyagerdemo.dto.StatisticsResponse;
import com.example.voyagerdemo.service.FujianPoiCollectorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/fujian-poi")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class FujianPoiController {
    
    private final FujianPoiCollectorService collectorService;
    


    /**
     * 采集所有城市POI（异步）
     */
    @PostMapping("/collect-all")
    public ResponseEntity<?> collectAllPois() {
        try {
            log.info("收到采集所有城市POI请求");
            collectorService.collectAllPoisAsync();
            return ResponseEntity.ok(Map.of(
                "message", "采集任务已启动",
                "tip", "请使用 GET /fujian-poi/status 查询采集进度"
            ));
        } catch (Exception e) {
            log.error("启动采集任务失败", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 采集指定城市POI
     */
    @PostMapping("/collect-city")
    public ResponseEntity<?> collectCityPois(@RequestParam String city) {
        try {
            log.info("收到采集城市POI请求: {}", city);
            int count = collectorService.collectCityPois(city);
            return ResponseEntity.ok(Map.of(
                "message", "采集完成",
                "city", city,
                "count", count
            ));
        } catch (Exception e) {
            log.error("采集城市POI失败: {}", city, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 查询采集进度和状态
     */
    @GetMapping("/status")
    public ResponseEntity<CollectionStatusResponse> getStatus() {
        CollectionStatusResponse status = collectorService.getCollectionStatus();
        return ResponseEntity.ok(status);
    }
    
    /**
     * 查询采集统计信息
     */
    @GetMapping("/statistics")
    public ResponseEntity<StatisticsResponse> getStatistics() {
        StatisticsResponse statistics = collectorService.getStatistics();
        return ResponseEntity.ok(statistics);
    }
    
    /**
     * 清空福建省POI数据
     */
    @DeleteMapping("/clear")
    public ResponseEntity<?> clearPois() {
        try {
            log.info("收到清空福建省POI数据请求");
            String result = collectorService.clearFujianPois();
            return ResponseEntity.ok(Map.of("message", result));
        } catch (Exception e) {
            log.error("清空失败", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
