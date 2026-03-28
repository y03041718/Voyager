package com.example.voyagerdemo.dto;

import lombok.Data;
import java.util.List;

/**
 * 创建/更新行程请求
 */
@Data
public class TripPlanRequest {
    private String destination;
    private String startDate;
    private String endDate;
    private String travelers;
    private String style;
    private List<SelectedPlace> selectedPlaces;
    private List<SelectedPlace> availablePlaces;
    
    @Data
    public static class SelectedPlace {
        private String id;
        private String name;
        private String type;
        private String image;
        private Double rating;
        private String address;
        private String starLevel;
        private String level;
        private String cost;
        private String tel;
        private Location location;
    }
    
    @Data
    public static class Location {
        private Double lat;
        private Double lng;
    }
}
