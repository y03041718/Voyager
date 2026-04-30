package com.example.voyagerdemo.repository;

import com.example.voyagerdemo.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegionRepository extends JpaRepository<Region, Long> {
    
    Optional<Region> findByProvinceAndCity(String province, String city);
    
    List<Region> findByProvince(String province);
    Optional<Region> findByCity(String city);

    boolean existsByProvinceAndCity(String province, String city);
}
