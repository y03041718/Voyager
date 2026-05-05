package com.example.voyagerdemo.dto;

import lombok.Data;
import java.util.List;

/**
 * 团队行程响应（按团队分组）
 */
@Data
public class TeamTripPlansResponse {
    private Long teamId;
    private String teamName;
    private String teamAvatarUrl;
    private List<TripPlanSummary> tripPlans;
}
