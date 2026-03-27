package com.example.voyagerdemo.controller;

import com.example.voyagerdemo.dto.AuthResponse;
import com.example.voyagerdemo.dto.LoginRequest;
import com.example.voyagerdemo.dto.RegisterRequest;
import com.example.voyagerdemo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${cors.allowed-origins}")
public class AuthController {
    
    private final UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = userService.register(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("注册失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = userService.login(request);
            log.info("登录成功，返回token: {}", response.getToken() != null ? "存在" : "null");
            log.info("返回响应: {}", response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("登录失败", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}