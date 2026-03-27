package com.example.voyagerdemo.repository;

import com.example.voyagerdemo.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    
    // 查找用户创建的团队
    List<Team> findByCreatorIdAndIsActiveTrue(Long creatorId);
    
    // 查找用户参与的所有团队（包括创建的和加入的）
    @Query("SELECT DISTINCT t FROM Team t LEFT JOIN t.members m WHERE (t.creatorId = :userId OR m.user.id = :userId) AND t.isActive = true")
    List<Team> findAllByUserId(@Param("userId") Long userId);
    
    // 查找团队（包含成员信息）
    @Query("SELECT t FROM Team t LEFT JOIN FETCH t.members WHERE t.id = :teamId AND t.isActive = true")
    Optional<Team> findByIdWithMembers(@Param("teamId") Long teamId);
    
    // 通过邀请码查找团队
    Optional<Team> findByInviteCodeAndIsActiveTrue(String inviteCode);
    
    // 检查邀请码是否存在
    boolean existsByInviteCode(String inviteCode);
}
