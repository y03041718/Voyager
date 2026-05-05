package com.example.voyagerdemo.controller;

import com.example.voyagerdemo.dto.WordCloudItem;
import com.example.voyagerdemo.service.SearchStatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stat")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class StatController {

    private final SearchStatService searchStatService;

    /**
     * 获取文本搜索词云数据
     */
    @GetMapping("/wordcloud")
    public ResponseEntity<List<WordCloudItem>> getTextSearchWordCloud() {
        try {
            List<WordCloudItem> wordCloud = searchStatService.getTextSearchWordCloud();
            return ResponseEntity.ok(wordCloud);
        } catch (Exception e) {
            log.error("获取文本搜索词云数据失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取省市搜索词云数据
     */
    @GetMapping("/provincecloud")
    public ResponseEntity<List<WordCloudItem>> getProvinceSearchWordCloud() {
        try {
            List<WordCloudItem> wordCloud = searchStatService.getProvinceSearchWordCloud();
            return ResponseEntity.ok(wordCloud);
        } catch (Exception e) {
            log.error("获取省市搜索词云数据失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 清空文本搜索统计（管理接口）
     */
    @DeleteMapping("/wordcloud")
    public ResponseEntity<String> clearTextSearchStat() {
        try {
            searchStatService.clearTextSearchStat();
            return ResponseEntity.ok("文本搜索统计已清空");
        } catch (Exception e) {
            log.error("清空文本搜索统计失败", e);
            return ResponseEntity.internalServerError().body("清空失败");
        }
    }

    /**
     * 清空省市搜索统计（管理接口）
     */
    @DeleteMapping("/provincecloud")
    public ResponseEntity<String> clearProvinceSearchStat() {
        try {
            searchStatService.clearProvinceSearchStat();
            return ResponseEntity.ok("省市搜索统计已清空");
        } catch (Exception e) {
            log.error("清空省市搜索统计失败", e);
            return ResponseEntity.internalServerError().body("清空失败");
        }
    }
}
