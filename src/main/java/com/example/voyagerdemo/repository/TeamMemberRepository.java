package com.example.voyagerdemo.repository;

import com.example.voyagerdemo.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    
    // 查找团队的所有成员
    @Query("SELECT tm FROM TeamMember tm WHERE tm.team.id = :teamId")
    List<TeamMember> findByTeamId(@Param("teamId") Long teamId);
    
    // 查找用户在某个团队中的成员记录
    @Query("SELECT tm FROM TeamMember tm WHERE tm.team.id = :teamId AND tm.user.id = :userId")
    Optional<TeamMember> findByTeamIdAndUserId(@Param("teamId") Long teamId, @Param("userId") Long userId);
    
    // 检查用户是否是团队成员
    @Query("SELECT CASE WHEN COUNT(tm) > 0 THEN true ELSE false END FROM TeamMember tm WHERE tm.team.id = :teamId AND tm.user.id = :userId")
    boolean existsByTeamIdAndUserId(@Param("teamId") Long teamId, @Param("userId") Long userId);
    
    // 统计团队成员数量
    @Query("SELECT COUNT(tm) FROM TeamMember tm WHERE tm.team.id = :teamId")
    long countByTeamId(@Param("teamId") Long teamId);
    
    // 删除团队成员
    @Modifying
    @Transactional
    @Query("DELETE FROM TeamMember tm WHERE tm.team.id = :teamId AND tm.user.id = :userId")
    void deleteByTeamIdAndUserId(@Param("teamId") Long teamId, @Param("userId") Long userId);
}
