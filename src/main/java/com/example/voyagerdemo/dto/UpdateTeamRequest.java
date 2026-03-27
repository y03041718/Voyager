package com.example.voyagerdemo.dto;

import lombok.Data;

@Data
public class UpdateTeamRequest {
    private String name;
    private String description;
    private String avatarUrl;
}
