package com.example.voyagerdemo.dto;

import lombok.Data;
import java.util.List;

@Data
public class TravelPlanResponse {
    private String destination;  // 目的地城市名
    private List<DayPlan> days;
    
    @Data
    public static class DayPlan {
        private Integer day;
        private String date;
        private List<Plan> plans;
        private Weather weather;  // 每日天气信息
        private LocalTips localTips;  // 当地特色与提示
    }
    
    @Data
    public static class Plan {
        private String time;
        private String type;
        private String name;
        private String desc;
        private String duration;
        // 从POI获取的完整信息
        private String id;
        private String image;
        private Double rating;
        private String address;
        private String starLevel;
        private String level;
        private String cost;
        private String tel;
    }
    
    @Data
    public static class Weather {
        private String temperature;    // 温度，如 "24"
        private String condition;      // 天气状况，如 "晴朗"
        private String feelsLike;      // 体感温度，如 "26"
    }
    
    @Data
    public static class LocalTips {
        private String culture;        // 文化特色
        private String food;           // 美食特色
        private String tips;           // 旅行提示
    }
}
