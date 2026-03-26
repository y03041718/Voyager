package com.example.voyagerdemo.controller;

import com.example.voyagerdemo.dto.TripPlanRequest;
import com.example.voyagerdemo.dto.TravelPlanResponse;
import com.example.voyagerdemo.service.TripPlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/trip")
@RequiredArgsConstructor
@Slf4j
public class TripPlanController {
    
    private final TripPlanService tripPlanService;
    
    /**
     * 生成旅行计划（返回JSON格式）
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generateTripPlan(@RequestBody TripPlanRequest request) {
        log.info("收到生成旅行计划请求: destination={}, dates={} to {}", 
                request.getDestination(), request.getStartDate(), request.getEndDate());
        
        try {
            TravelPlanResponse response = tripPlanService.generateTravelPlan(request);
            log.info("旅行计划生成成功，返回城市名: {}", response.getDestination());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("生成旅行计划失败", e);
            String errorMessage = e.getMessage() != null ? e.getMessage() : "未知错误";
            return ResponseEntity.internalServerError().body(errorMessage);
        }
    }
}
