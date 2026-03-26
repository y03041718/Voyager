package com.example.voyagerdemo.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AuthResponse {
    private UserDto user;
    
    @Data
    @AllArgsConstructor
    public static class UserDto {
        private Long id;
        private String username;
        private String teamName;
        private LocalDateTime createdAt;

        public void setId(Long id) {
            this.id = id;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public void setTeamName(String teamName) {
            this.teamName = teamName;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }
}