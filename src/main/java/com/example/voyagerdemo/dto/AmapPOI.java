package com.example.voyagerdemo.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AmapPOI {
    private String id;
    private String name;
    private String type;
    private String address;
    private String cityname;  // 城市名
    private String adname;    // 区域名
    private Location location;
    private String tel;
    private Double rating;
    private List<String> photos;
    private Integer distance;

    // 酒店相关
    private String starLevel; // 星级 (keytag字段)

    // 景点相关
    private String level; // 评级 (keytag字段)

    // 餐厅相关
    private String cost; // 人均价格

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Location {
        private Double lat;
        private Double lng;

        public void setLat(Double lat) {
            this.lat = lat;
        }

        public void setLng(Double lng) {
            this.lng = lng;
        }
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public void setTel(String tel) {
        this.tel = tel;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public void setPhotos(List<String> photos) {
        this.photos = photos;
    }

    public void setDistance(Integer distance) {
        this.distance = distance;
    }
}