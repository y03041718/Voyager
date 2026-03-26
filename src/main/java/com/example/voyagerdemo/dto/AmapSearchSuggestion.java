package com.example.voyagerdemo.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AmapSearchSuggestion {
    private String id;
    private String name;
    private String district;
    private String address;
    private Location location;

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

    public void setDistrict(String district) {
        this.district = district;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setLocation(Location location) {
        this.location = location;
    }
}