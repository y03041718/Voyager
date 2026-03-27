package com.example.voyagerdemo.service;

import com.example.voyagerdemo.dto.AuthResponse;
import com.example.voyagerdemo.dto.LoginRequest;
import com.example.voyagerdemo.dto.RegisterRequest;
import com.example.voyagerdemo.dto.UpdateProfileRequest;
import com.example.voyagerdemo.dto.ChangePasswordRequest;
import com.example.voyagerdemo.entity.User;
import com.example.voyagerdemo.repository.UserRepository;
import com.example.voyagerdemo.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;



@Service
@RequiredArgsConstructor
@Slf4j
public class UserService implements UserDetailsService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + username));
    }
    
    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }
    
    public AuthResponse register(RegisterRequest request) {
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已被注册");
        }
        
        // 创建新用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setTeamName(request.getTeamName());
        
        User savedUser = userRepository.save(user);
        log.info("新用户注册成功: {}", savedUser.getUsername());


        // 生成JWT token
        String token = jwtUtil.generateToken(savedUser.getUsername(), savedUser.getId());

        return new AuthResponse(
                token,
                new AuthResponse.UserDto(
                        savedUser.getId(),
                        savedUser.getUsername(),
                        savedUser.getTeamName(),
                        savedUser.getCreatedAt()
                )
        );
    }
    
    public AuthResponse login(LoginRequest request) {
        // 查找用户
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));
        
        // 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }
        
        log.info("用户登录成功: {}", user.getUsername());

        // 生成JWT token
        String token = jwtUtil.generateToken(user.getUsername(), user.getId());

        return new AuthResponse(
                token,
                new AuthResponse.UserDto(
                        user.getId(),
                        user.getUsername(),
                        user.getTeamName(),
                        user.getCreatedAt()
                )
        );
    }

    /**
     * 更新用户资料
     */
    @Transactional
    public User updateProfile(Long userId, UpdateProfileRequest request) {
        log.info("更新用户资料: userId={}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        return userRepository.save(user);
    }

    /**
     * 修改密码
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        log.info("修改密码: userId={}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        // 验证旧密码
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("旧密码不正确");
        }

        // 设置新密码
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * 获取用户信息
     */
    public User getUserInfo(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
}