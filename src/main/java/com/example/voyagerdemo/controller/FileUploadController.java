package com.example.voyagerdemo.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/upload")
@Slf4j
@CrossOrigin(origins = "${cors.allowed-origins}")
public class FileUploadController {

    // 固定路径：项目根目录下的 src/pics
    private final String uploadDir = System.getProperty("user.dir") + "/src/pics";

    @Value("${server.port:8080}")
    private String serverPort;

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            // 验证文件
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("文件不能为空");
            }

            // 验证文件类型
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("只能上传图片文件");
            }

            // 验证文件大小 (5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body("文件大小不能超过5MB");
            }

            // 创建 src/pics 文件夹（如果不存在）
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("创建上传目录: {}", uploadPath.toAbsolutePath());
            }

            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = "avatar_" + UUID.randomUUID().toString() + extension;

            // 保存文件到 src/pics
            Path filePath = uploadPath.resolve(filename);
            file.transferTo(filePath.toFile());

            // 返回文件访问URL
            String fileUrl = "http://localhost:" + serverPort + "/api/pics/" + filename;
            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("filename", filename);

            log.info("文件上传成功: {}, 保存路径: {}, 访问URL: {}",
                    filename, filePath.toAbsolutePath(), fileUrl);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("文件上传失败", e);
            return ResponseEntity.internalServerError().body("文件上传失败: " + e.getMessage());
        }
    }
}
