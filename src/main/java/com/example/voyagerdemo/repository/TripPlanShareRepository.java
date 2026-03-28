package com.example.voyagerdemo.repository;

import com.example.voyagerdemo.entity.TripPlanShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripPlanShareRepository extends JpaRepository<TripPlanShare, Long> {
    
    /**
     * 检查行程是否已分享给团队
     */
    boolean existsByTripPlanIdAndTeamId(Long tripPlanId, Long teamId);
    
    /**
     * 查询行程分享到的所有团队
     */
    List<TripPlanShare> findByTripPlanId(Long tripPlanId);
    
    /**
     * 查询团队的所有分享行程
     */
    List<TripPlanShare> findByTeamId(Long teamId);
    
    /**
     * 删除分享记录
     */
    void deleteByTripPlanIdAndTeamId(Long tripPlanId, Long teamId);
}
