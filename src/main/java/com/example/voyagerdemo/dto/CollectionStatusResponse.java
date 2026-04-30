package com.example.voyagerdemo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollectionStatusResponse {
    private String status; // running/completed/failed
    private int totalCities;
    private int completedCities;
    private String currentCity;
    private int totalPois;
    private String startTime;
    private String estimatedEndTime;
    private Map<String, String> cityStatus; // cityName -> status
    private String errorMessage;
}
