package com.example.voyagerdemo.repository;

import com.example.voyagerdemo.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    
    // 查找团队的所有成员
    List<TeamMember> findByTeamId(Long teamId);
    
    // 查找用户在某个团队中的成员记录
    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);
    
    // 检查用户是否是团队成员
    boolean existsByTeamIdAndUserId(Long teamId, Long userId);
    
    // 统计团队成员数量
    long countByTeamId(Long teamId);
    
    // 删除团队成员
    void deleteByTeamIdAndUserId(Long teamId, Long userId);
}
