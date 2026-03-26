package com.example.voyagerdemo.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SearchAllResponse {
    private List<AmapPOI> hotels;
    private List<AmapPOI> attractions;
    private List<AmapPOI> restaurants;
}