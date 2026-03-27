package com.example.voyagerdemo.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TeamResponse {
    private Long id;
    private String name;
    private String inviteCode;
    private String description;
    private String avatarUrl;
    private Long creatorId;
    private String creatorName;
    private LocalDateTime createdAt;
    private List<TeamMemberInfo> members;
    
    @Data
    public static class TeamMemberInfo {
        private Long id;
        private Long userId;
        private String username;
        private String nickname;
        private String avatarUrl;
        private String role;
        private LocalDateTime joinedAt;
    }
}
