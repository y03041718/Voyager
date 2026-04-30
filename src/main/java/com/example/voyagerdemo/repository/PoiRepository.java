package com.example.voyagerdemo.repository;

import com.example.voyagerdemo.entity.Poi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PoiRepository extends JpaRepository<Poi, Long> {
    
    List<Poi> findByRegionIdAndType(Long regionId, String type);
    
    List<Poi> findByRegionId(Long regionId);
    
    boolean existsByRegionIdAndAmapId(Long regionId, String amapId);
    
    int countByRegionId(Long regionId);
    
    @Modifying
    @Query("DELETE FROM Poi p WHERE p.regionId IN (SELECT r.id FROM Region r WHERE r.province = :province)")
    void deleteByProvince(String province);
}
