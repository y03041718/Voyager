package com.example.voyagerdemo.dto;

import lombok.Data;
import java.util.List;

@Data
public class TripPlanResponse {
    private String itinerary; // AI生成的完整行程文本
    private List<DayPlan> dayPlans; // 解析后的每日计划
    
    @Data
    public static class DayPlan {
        private Integer day;
        private String date;
        private String subtitle;
        private List<Activity> activities;
    }
    
    @Data
    public static class Activity {
        private String id;
        private String time;
        private String title;
        private String description;
        private String type;
        private String image;
        private String location;
        private String address;
        private Double rating;
        private String duration;
        private String tip;
    }
}
