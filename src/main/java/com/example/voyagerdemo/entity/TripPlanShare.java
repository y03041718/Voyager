package com.example.voyagerdemo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_plan_shares")
@Data
public class TripPlanShare {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "trip_plan_id", nullable = false)
    private Long tripPlanId;
    
    @Column(name = "team_id", nullable = false)
    private Long teamId;
    
    @Column(name = "shared_by", nullable = false)
    private Long sharedBy;
    
    @Column(name = "shared_at", nullable = false, updatable = false)
    private LocalDateTime sharedAt;
    
    @PrePersist
    protected void onCreate() {
        sharedAt = LocalDateTime.now();
    }
}
