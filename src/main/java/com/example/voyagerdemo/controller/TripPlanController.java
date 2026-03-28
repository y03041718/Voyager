package com.example.voyagerdemo.controller;

import com.example.voyagerdemo.dto.*;
import com.example.voyagerdemo.service.TripPlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/trip-plans")
@RequiredArgsConstructor
@Slf4j
public class TripPlanController {

    private final TripPlanService tripPlanService;

    /**
     * 生成旅行计划（会自动保存）
     */
    @PostMapping("/generate")
    public ResponseEntity<TravelPlanResponse> generateTravelPlan(@RequestBody TripPlanRequest request) {
        log.info("收到生成旅行计划请求: destination={}", request.getDestination());
        TravelPlanResponse response = tripPlanService.generateTravelPlan(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 查询我的所有行程
     */
    @GetMapping("/my")
    public ResponseEntity<List<TripPlanSummary>> getMyTripPlans() {
        List<TripPlanSummary> plans = tripPlanService.getMyTripPlans();
        return ResponseEntity.ok(plans);
    }

    /**
     * 查询可见的所有行程（我的 + 团队分享的）
     */
    @GetMapping("/visible")
    public ResponseEntity<List<TripPlanSummary>> getVisibleTripPlans() {
        List<TripPlanSummary> plans = tripPlanService.getVisibleTripPlans();
        return ResponseEntity.ok(plans);
    }

    /**
     * 查询行程详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<TripPlanResponse> getTripPlanDetail(@PathVariable Long id) {
        TripPlanResponse response = tripPlanService.getTripPlanDetail(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 更新行程
     */
    @PutMapping("/{id}")
    public ResponseEntity<TripPlanResponse> updateTripPlan(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestBody) {
        
        // 从requestBody中提取TripPlanRequest和TravelPlanResponse
        // 这里简化处理，实际应该分别解析
        log.warn("更新行程功能需要前端传递完整的request和travelPlan数据");
        
        return ResponseEntity.ok().build();
    }

    /**
     * 删除行程
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTripPlan(@PathVariable Long id) {
        tripPlanService.deleteTripPlan(id);
        return ResponseEntity.ok(Map.of("message", "行程已删除"));
    }

    /**
     * 分享行程到团队
     */
    @PostMapping("/{id}/share")
    public ResponseEntity<Map<String, String>> shareTripPlan(
            @PathVariable Long id,
            @RequestBody ShareTripPlanRequest request) {
        
        tripPlanService.shareTripPlan(id, request.getTeamId());
        return ResponseEntity.ok(Map.of("message", "行程已分享到团队"));
    }

    /**
     * 取消分享
     */
    @DeleteMapping("/{id}/share/{teamId}")
    public ResponseEntity<Map<String, String>> unshareTripPlan(
            @PathVariable Long id,
            @PathVariable Long teamId) {
        
        tripPlanService.unshareTripPlan(id, teamId);
        return ResponseEntity.ok(Map.of("message", "已取消分享"));
    }
}
