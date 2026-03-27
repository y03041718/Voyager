package com.example.voyagerdemo.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String nickname;
    private String email;
    private String phone;
    private String avatarUrl;
}
