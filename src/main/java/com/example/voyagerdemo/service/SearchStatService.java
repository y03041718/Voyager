package com.example.voyagerdemo.service;

import com.example.voyagerdemo.dto.WordCloudItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchStatService {

    private final RedisTemplate<String, Object> redisTemplate;

    // Redis key常量
    private static final String TEXT_SEARCH_STAT_KEY = "stat:search:text";
    private static final String PROVINCE_SEARCH_STAT_KEY = "stat:search:province";

    /**
     * 记录文本搜索统计
     */
    public void recordTextSearch(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return;
        }

        try {
            redisTemplate.opsForHash().increment(TEXT_SEARCH_STAT_KEY, keyword.trim(), 1);
            log.debug("记录文本搜索统计: {}", keyword);
        } catch (Exception e) {
            log.error("记录文本搜索统计失败: {}", keyword, e);
        }
    }

    /**
     * 记录省市搜索统计
     */
    public void recordProvinceSearch(String province, String city) {
        if (province == null || province.trim().isEmpty()) {
            return;
        }

        try {
            String key = city != null && !city.trim().isEmpty()
                    ? province.trim() + "-" + city.trim()
                    : province.trim();

            redisTemplate.opsForHash().increment(PROVINCE_SEARCH_STAT_KEY, key, 1);
            log.debug("记录省市搜索统计: {}", key);
        } catch (Exception e) {
            log.error("记录省市搜索统计失败: {}-{}", province, city, e);
        }
    }

    /**
     * 获取文本搜索词云数据
     */
    public List<WordCloudItem> getTextSearchWordCloud() {
        try {
            Map<Object, Object> entries = redisTemplate.opsForHash().entries(TEXT_SEARCH_STAT_KEY);

            List<WordCloudItem> result = new ArrayList<>();
            for (Map.Entry<Object, Object> entry : entries.entrySet()) {
                String text = entry.getKey().toString();
                Long value = Long.parseLong(entry.getValue().toString());
                result.add(new WordCloudItem(text, value));
            }

            // 按搜索次数降序排序
            result.sort((a, b) -> Long.compare(b.getValue(), a.getValue()));

            log.info("获取文本搜索词云数据: {} 个关键词", result.size());
            return result;
        } catch (Exception e) {
            log.error("获取文本搜索词云数据失败", e);
            return new ArrayList<>();
        }
    }

    /**
     * 获取省市搜索词云数据
     */
    public List<WordCloudItem> getProvinceSearchWordCloud() {
        try {
            Map<Object, Object> entries = redisTemplate.opsForHash().entries(PROVINCE_SEARCH_STAT_KEY);

            List<WordCloudItem> result = new ArrayList<>();
            for (Map.Entry<Object, Object> entry : entries.entrySet()) {
                String text = entry.getKey().toString();
                Long value = Long.parseLong(entry.getValue().toString());
                result.add(new WordCloudItem(text, value));
            }

            // 按搜索次数降序排序
            result.sort((a, b) -> Long.compare(b.getValue(), a.getValue()));

            log.info("获取省市搜索词云数据: {} 个省市", result.size());
            return result;
        } catch (Exception e) {
            log.error("获取省市搜索词云数据失败", e);
            return new ArrayList<>();
        }
    }

    /**
     * 清空文本搜索统计
     */
    public void clearTextSearchStat() {
        try {
            redisTemplate.delete(TEXT_SEARCH_STAT_KEY);
            log.info("清空文本搜索统计");
        } catch (Exception e) {
            log.error("清空文本搜索统计失败", e);
        }
    }

    /**
     * 清空省市搜索统计
     */
    public void clearProvinceSearchStat() {
        try {
            redisTemplate.delete(PROVINCE_SEARCH_STAT_KEY);
            log.info("清空省市搜索统计");
        } catch (Exception e) {
            log.error("清空省市搜索统计失败", e);
        }
    }
}
