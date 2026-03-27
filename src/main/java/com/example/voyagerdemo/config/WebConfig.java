package com.example.voyagerdemo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 配置 /pics/** 映射到项目根目录下的 src/pics 目录
        String picsPath = Paths.get(System.getProperty("user.dir"), "src", "pics")
                .toAbsolutePath()
                .toUri()
                .toString();
        
        registry.addResourceHandler("/pics/**")
                .addResourceLocations(picsPath);
    }
}
