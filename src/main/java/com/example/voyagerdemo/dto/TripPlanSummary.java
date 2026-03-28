package com.example.voyagerdemo.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 行程摘要（用于列表展示）
 */
@Data
public class TripPlanSummary {
    private Long id;
    private String title;
    private String destination;
    private LocalDate startDate;
    private LocalDate endDate;
    private String travelers;
    private String style;
    private String coverImage;
    private LocalDateTime createdAt;
    private Boolean isOwner;  // 是否是创建者
}
