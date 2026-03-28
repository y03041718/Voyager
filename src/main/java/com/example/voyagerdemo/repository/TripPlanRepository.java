package com.example.voyagerdemo.repository;

import com.example.voyagerdemo.entity.TripPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripPlanRepository extends JpaRepository<TripPlan, Long> {
    
    /**
     * 查询用户的所有行程（按创建时间倒序）
     */
    List<TripPlan> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(Long userId);
    
    /**
     * 查询用户的特定行程
     */
    Optional<TripPlan> findByIdAndUserIdAndIsActiveTrue(Long id, Long userId);
    
    /**
     * 查询用户可见的所有行程（我的 + 团队分享的）
     */
    @Query("""
        SELECT DISTINCT tp FROM TripPlan tp
        LEFT JOIN TripPlanShare tps ON tp.id = tps.tripPlanId
        LEFT JOIN TeamMember tm ON tps.teamId = tm.team.id
        WHERE (tp.userId = :userId OR tm.user.id = :userId)
          AND tp.isActive = true
        ORDER BY tp.createdAt DESC
    """)
    List<TripPlan> findVisibleTripPlans(@Param("userId") Long userId);
    
    /**
     * 按目的地搜索
     */
    List<TripPlan> findByUserIdAndDestinationContainingAndIsActiveTrueOrderByCreatedAtDesc(
        Long userId, String destination);
}
