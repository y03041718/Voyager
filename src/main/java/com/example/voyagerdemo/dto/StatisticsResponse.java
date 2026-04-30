package com.example.voyagerdemo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsResponse {
    private int totalPois;
    private Map<String, Integer> poiByCity;
    private Map<String, Integer> poiByType;
    private String lastUpdateTime;
}
