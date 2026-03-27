package com.example.voyagerdemo.controller;

import com.example.voyagerdemo.dto.*;
import com.example.voyagerdemo.entity.User;
import com.example.voyagerdemo.service.TeamService;
import com.example.voyagerdemo.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TeamController {

    private final TeamService teamService;
    private final UserService userService;

    /**
     * 创建团队
     */
    @PostMapping
    public ResponseEntity<?> createTeam(
            @RequestBody CreateTeamRequest request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.badRequest().body("用户不存在");
            }
            
            TeamResponse team = teamService.createTeam(request, user.getId());
            return ResponseEntity.ok(team);
        } catch (Exception e) {
            log.error("创建团队失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 获取用户的所有团队
     */
    @GetMapping
    public ResponseEntity<?> getUserTeams(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.badRequest().body("用户不存在");
            }
            
            List<TeamResponse> teams = teamService.getUserTeams(user.getId());
            return ResponseEntity.ok(teams);
        } catch (Exception e) {
            log.error("获取团队列表失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 获取团队详情
     */
    @GetMapping("/{teamId}")
    public ResponseEntity<?> getTeamDetail(
            @PathVariable Long teamId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.badRequest().body("用户不存在");
            }
            
            TeamResponse team = teamService.getTeamDetail(teamId, user.getId());
            return ResponseEntity.ok(team);
        } catch (Exception e) {
            log.error("获取团队详情失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 更新团队信息
     */
    @PutMapping("/{teamId}")
    public ResponseEntity<?> updateTeam(
            @PathVariable Long teamId,
            @RequestBody UpdateTeamRequest request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.badRequest().body("用户不存在");
            }
            
            TeamResponse team = teamService.updateTeam(teamId, request, user.getId());
            return ResponseEntity.ok(team);
        } catch (Exception e) {
            log.error("更新团队信息失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 添加团队成员
     */
    @PostMapping("/{teamId}/members")
    public ResponseEntity<?> addTeamMember(
            @PathVariable Long teamId,
            @RequestBody AddTeamMemberRequest request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.badRequest().body("用户不存在");
            }
            
            teamService.addTeamMember(teamId, request, user.getId());
            return ResponseEntity.ok("添加成员成功");
        } catch (Exception e) {
            log.error("添加团队成员失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 删除团队成员
     */
    @DeleteMapping("/{teamId}/members/{memberUserId}")
    public ResponseEntity<?> removeTeamMember(
            @PathVariable Long teamId,
            @PathVariable Long memberUserId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.badRequest().body("用户不存在");
            }
            
            teamService.removeTeamMember(teamId, memberUserId, user.getId());
            return ResponseEntity.ok("删除成员成功");
        } catch (Exception e) {
            log.error("删除团队成员失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 退出团队
     */
    @PostMapping("/{teamId}/leave")
    public ResponseEntity<?> leaveTeam(
            @PathVariable Long teamId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.badRequest().body("用户不存在");
            }
            
            teamService.leaveTeam(teamId, user.getId());
            return ResponseEntity.ok("退出团队成功");
        } catch (Exception e) {
            log.error("退出团队失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 删除团队
     */
    @DeleteMapping("/{teamId}")
    public ResponseEntity<?> deleteTeam(
            @PathVariable Long teamId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.badRequest().body("用户不存在");
            }
            
            teamService.deleteTeam(teamId, user.getId());
            return ResponseEntity.ok("删除团队成功");
        } catch (Exception e) {
            log.error("删除团队失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 通过邀请码加入团队
     */
    @PostMapping("/join/{inviteCode}")
    public ResponseEntity<?> joinTeamByInviteCode(
            @PathVariable String inviteCode,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.badRequest().body("用户不存在");
            }
            
            TeamResponse team = teamService.joinTeamByInviteCode(inviteCode, user.getId());
            return ResponseEntity.ok(team);
        } catch (Exception e) {
            log.error("加入团队失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
