package com.example.voyagerdemo.dto;

import lombok.Data;
import java.util.List;

@Data
public class TripPlanRequest {
    private String destination; // 目的地
    private String startDate; // 开始日期
    private String endDate; // 结束日期
    private String travelers; // 旅行者类型
    private String style; // 旅行风格
    private List<SelectedPlace> selectedPlaces; // 用户选中的地点（必选）
    private List<SelectedPlace> availablePlaces; // 所有可用的地点（供AI选择）
    
    @Data
    public static class SelectedPlace {
        private String id;
        private String name;
        private String type; // hotel, attraction, restaurant
        private String address;
        private Double rating;
        private String starLevel; // 酒店星级
        private String level; // 景点评级
        private String cost; // 餐厅人均
        private LocationInfo location;
        private String image; // 图片URL
        private String tel; // 电话
    }
    
    @Data
    public static class LocationInfo {
        private Double lat;
        private Double lng;
    }
}
