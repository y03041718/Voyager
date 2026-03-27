package com.example.voyagerdemo.service;

import com.example.voyagerdemo.dto.*;
import com.example.voyagerdemo.entity.Team;
import com.example.voyagerdemo.entity.TeamMember;
import com.example.voyagerdemo.entity.User;
import com.example.voyagerdemo.repository.TeamMemberRepository;
import com.example.voyagerdemo.repository.TeamRepository;
import com.example.voyagerdemo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    /**
     * 创建团队
     */
    @Transactional
    public TeamResponse createTeam(CreateTeamRequest request, Long creatorId) {
        log.info("创建团队: name={}, creatorId={}", request.getName(), creatorId);

        // 生成唯一的4位邀请码
        String inviteCode = generateUniqueInviteCode();

        // 创建团队
        Team team = new Team();
        team.setName(request.getName());
        team.setInviteCode(inviteCode);
        team.setDescription(request.getDescription());
        team.setAvatarUrl(request.getAvatarUrl());
        team.setCreatorId(creatorId);
        team = teamRepository.save(team);

        // 创建者自动成为团队成员
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        TeamMember creatorMember = new TeamMember();
        creatorMember.setTeam(team);
        creatorMember.setUser(creator);
        creatorMember.setRole("creator");
        teamMemberRepository.save(creatorMember);

        log.info("团队创建成功，邀请码: {}", inviteCode);
        return convertToResponse(team);
    }

    /**
     * 生成唯一的4位邀请码
     */
    private String generateUniqueInviteCode() {
        String inviteCode;
        do {
            // 生成1000-9999之间的随机数
            inviteCode = String.format("%04d", (int)(Math.random() * 9000) + 1000);
        } while (teamRepository.existsByInviteCode(inviteCode));
        return inviteCode;
    }

    /**
     * 通过邀请码加入团队
     */
    @Transactional
    public TeamResponse joinTeamByInviteCode(String inviteCode, Long userId) {
        log.info("用户加入团队: inviteCode={}, userId={}", inviteCode, userId);
        
        // 查找团队
        Team team = teamRepository.findByInviteCodeAndIsActiveTrue(inviteCode)
                .orElseThrow(() -> new RuntimeException("团队不存在或邀请码无效"));
        
        // 查找用户
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        // 检查是否已经是成员
        if (teamMemberRepository.existsByTeamIdAndUserId(team.getId(), userId)) {
            throw new RuntimeException("您已经是该团队成员");
        }
        
        // 添加成员
        TeamMember member = new TeamMember();
        member.setTeam(team);
        member.setUser(user);
        member.setRole("member");
        teamMemberRepository.save(member);
        
        log.info("用户成功加入团队: teamId={}, userId={}", team.getId(), userId);
        return convertToResponse(team);
    }

    /**
     * 获取用户的所有团队
     */
    public List<TeamResponse> getUserTeams(Long userId) {
        log.info("获取用户团队列表: userId={}", userId);
        List<Team> teams = teamRepository.findAllByUserId(userId);
        return teams.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * 获取团队详情
     */
    public TeamResponse getTeamDetail(Long teamId, Long userId) {
        log.info("获取团队详情: teamId={}, userId={}", teamId, userId);
        
        Team team = teamRepository.findByIdWithMembers(teamId)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        
        // 检查用户是否是团队成员
        if (!isTeamMember(teamId, userId)) {
            throw new RuntimeException("您不是该团队成员");
        }
        
        return convertToResponse(team);
    }

    /**
     * 更新团队信息
     */
    @Transactional
    public TeamResponse updateTeam(Long teamId, UpdateTeamRequest request, Long userId) {
        log.info("更新团队信息: teamId={}, userId={}", teamId, userId);
        
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        
        // 只有创建者可以修改团队信息
        if (!team.getCreatorId().equals(userId)) {
            throw new RuntimeException("只有创建者可以修改团队信息");
        }
        
        if (request.getName() != null) {
            team.setName(request.getName());
        }
        if (request.getDescription() != null) {
            team.setDescription(request.getDescription());
        }
        if (request.getAvatarUrl() != null) {
            team.setAvatarUrl(request.getAvatarUrl());
        }
        
        team = teamRepository.save(team);
        return convertToResponse(team);
    }

    /**
     * 添加团队成员
     */
    @Transactional
    public void addTeamMember(Long teamId, AddTeamMemberRequest request, Long operatorId) {
        log.info("添加团队成员: teamId={}, username={}, operatorId={}", 
                teamId, request.getUsername(), operatorId);
        
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        
        // 只有创建者可以添加成员
        if (!team.getCreatorId().equals(operatorId)) {
            throw new RuntimeException("只有创建者可以添加成员");
        }
        
        // 查找要添加的用户
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        // 检查是否已经是成员
        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, user.getId())) {
            throw new RuntimeException("该用户已经是团队成员");
        }
        
        // 添加成员
        TeamMember member = new TeamMember();
        member.setTeam(team);
        member.setUser(user);
        member.setRole("member");
        teamMemberRepository.save(member);
    }

    /**
     * 删除团队成员
     */
    @Transactional
    public void removeTeamMember(Long teamId, Long memberUserId, Long operatorId) {
        log.info("删除团队成员: teamId={}, memberUserId={}, operatorId={}", 
                teamId, memberUserId, operatorId);
        
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        
        // 只有创建者可以删除成员
        if (!team.getCreatorId().equals(operatorId)) {
            throw new RuntimeException("只有创建者可以删除成员");
        }
        
        // 不能删除创建者自己
        if (memberUserId.equals(team.getCreatorId())) {
            throw new RuntimeException("不能删除创建者");
        }
        
        teamMemberRepository.deleteByTeamIdAndUserId(teamId, memberUserId);
    }

    /**
     * 成员退出团队
     */
    @Transactional
    public void leaveTeam(Long teamId, Long userId) {
        log.info("成员退出团队: teamId={}, userId={}", teamId, userId);
        
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        
        // 创建者不能退出，只能删除团队
        if (team.getCreatorId().equals(userId)) {
            throw new RuntimeException("创建者不能退出团队，请删除团队");
        }
        
        teamMemberRepository.deleteByTeamIdAndUserId(teamId, userId);
    }

    /**
     * 删除团队
     */
    @Transactional
    public void deleteTeam(Long teamId, Long userId) {
        log.info("删除团队: teamId={}, userId={}", teamId, userId);
        
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("团队不存在"));
        
        // 只有创建者可以删除团队
        if (!team.getCreatorId().equals(userId)) {
            throw new RuntimeException("只有创建者可以删除团队");
        }
        
        // 检查是否还有其他成员
        long memberCount = teamMemberRepository.countByTeamId(teamId);
        if (memberCount > 1) { // 大于1表示除了创建者还有其他成员
            throw new RuntimeException("团队还有其他成员，请先移除所有成员");
        }
        
        // 软删除
        team.setIsActive(false);
        teamRepository.save(team);
    }

    /**
     * 检查用户是否是团队成员
     */
    private boolean isTeamMember(Long teamId, Long userId) {
        Team team = teamRepository.findById(teamId).orElse(null);
        if (team == null) {
            return false;
        }
        // 创建者或成员都算
        return team.getCreatorId().equals(userId) || 
               teamMemberRepository.existsByTeamIdAndUserId(teamId, userId);
    }

    /**
     * 转换为响应DTO
     */
    private TeamResponse convertToResponse(Team team) {
        TeamResponse response = new TeamResponse();
        response.setId(team.getId());
        response.setName(team.getName());
        response.setInviteCode(team.getInviteCode());
        response.setDescription(team.getDescription());
        response.setAvatarUrl(team.getAvatarUrl());
        response.setCreatorId(team.getCreatorId());
        response.setCreatedAt(team.getCreatedAt());
        
        // 获取创建者信息
        userRepository.findById(team.getCreatorId()).ifPresent(creator -> {
            response.setCreatorName(creator.getUsername());
        });
        
        // 获取成员列表
        List<TeamMember> members = teamMemberRepository.findByTeamId(team.getId());
        List<TeamResponse.TeamMemberInfo> memberInfos = members.stream()
                .map(member -> {
                    TeamResponse.TeamMemberInfo info = new TeamResponse.TeamMemberInfo();
                    info.setId(member.getId());
                    info.setUserId(member.getUser().getId());
                    info.setUsername(member.getUser().getUsername());
                    info.setNickname(member.getUser().getNickname());
                    info.setAvatarUrl(member.getUser().getAvatarUrl());
                    info.setRole(member.getRole());
                    info.setJoinedAt(member.getJoinedAt());
                    return info;
                })
                .collect(Collectors.toList());
        response.setMembers(memberInfos);
        
        return response;
    }
}
