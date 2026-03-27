package com.example.voyagerdemo.controller;

import com.example.voyagerdemo.dto.ChangePasswordRequest;
import com.example.voyagerdemo.dto.UpdateProfileRequest;
import com.example.voyagerdemo.entity.User;
import com.example.voyagerdemo.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UserProfileController {

    private final UserService userService;

    /**
     * 获取当前用户信息
     */
    @GetMapping
    public ResponseEntity<?> getCurrentUserProfile(Authentication authentication) {
        try {
            log.info("获取用户信息请求，Authentication: {}", authentication);
            if (authentication == null) {
                log.error("Authentication为null");
                return ResponseEntity.status(401).body("未认证");
            }
            
            String username = authentication.getName();
            log.info("当前用户名: {}", username);
            
            User user = userService.findByUsername(username);
            if (user == null) {
                log.error("用户不存在: {}", username);
                return ResponseEntity.badRequest().body("用户不存在");
            }
            
            log.info("返回用户信息: {}", user.getUsername());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            log.error("获取用户信息失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 更新用户资料
     */
    @PutMapping
    public ResponseEntity<?> updateProfile(
            @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.badRequest().body("用户不存在");
            }
            
            User updatedUser = userService.updateProfile(user.getId(), request);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            log.error("更新用户资料失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 修改密码
     */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.badRequest().body("用户不存在");
            }
            
            userService.changePassword(user.getId(), request);
            return ResponseEntity.ok("密码修改成功");
        } catch (Exception e) {
            log.error("修改密码失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
