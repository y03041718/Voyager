package com.example.voyagerdemo.service;

import com.example.voyagerdemo.dto.AuthResponse;
import com.example.voyagerdemo.dto.LoginRequest;
import com.example.voyagerdemo.dto.RegisterRequest;
import com.example.voyagerdemo.entity.User;
import com.example.voyagerdemo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService implements UserDetailsService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + username));
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
        
        return new AuthResponse(
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
        
        return new AuthResponse(
                new AuthResponse.UserDto(
                        user.getId(),
                        user.getUsername(),
                        user.getTeamName(),
                        user.getCreatedAt()
                )
        );
    }
}