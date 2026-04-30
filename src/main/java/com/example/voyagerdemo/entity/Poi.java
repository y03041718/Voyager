package com.example.voyagerdemo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "poi")
@Data
public class Poi {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long regionId;
    
    @Column(nullable = false, length = 100)
    private String amapId;
    
    @Column(nullable = false, length = 200)
    private String name;
    
    @Column(nullable = false, length = 50)
    private String type; // hotel/attraction/restaurant
    
    @Column(length = 500)
    private String address;
    
    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal locationLat;
    
    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal locationLng;
    
    @Column(precision = 3, scale = 1)
    private BigDecimal rating;
    
    @Column(length = 50)
    private String tel;
    
    @Column(length = 20)
    private String starLevel;
    
    @Column(length = 20)
    private String level;
    
    @Column(length = 20)
    private String cost;
    
    @Column(columnDefinition = "TEXT")
    private String photos;
    
    @Column(length = 100)
    private String amapType;
    
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
