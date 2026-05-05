package com.example.voyagerdemo.service;

import com.example.voyagerdemo.dto.AmapPOI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class PoiCacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    // 缓存key前缀
    private static final String TEXT_SEARCH_CACHE_PREFIX = "travel:poi:text:";

    // 缓存过期时间：24小时
    private static final long CACHE_EXPIRE_HOURS = 24;

    /**
     * 获取文本搜索缓存
     */
    @SuppressWarnings("unchecked")
    public List<AmapPOI> getTextSearchCache(String keyword, String city) {
        try {
            String cacheKey = buildTextSearchKey(keyword, city);
            Object cached = redisTemplate.opsForValue().get(cacheKey);

            if (cached != null) {
                log.info("命中文本搜索缓存: keyword={}, city={}", keyword, city);
                return (List<AmapPOI>) cached;
            }

            log.debug("未命中文本搜索缓存: keyword={}, city={}", keyword, city);
            return null;
        } catch (Exception e) {
            log.error("获取文本搜索缓存失败: keyword={}, city={}", keyword, city, e);
            return null;
        }
    }

    /**
     * 设置文本搜索缓存
     */
    public void setTextSearchCache(String keyword, String city, List<AmapPOI> pois) {
        try {
            String cacheKey = buildTextSearchKey(keyword, city);
            redisTemplate.opsForValue().set(cacheKey, pois, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
            log.info("设置文本搜索缓存: keyword={}, city={}, count={}", keyword, city, pois.size());
        } catch (Exception e) {
            log.error("设置文本搜索缓存失败: keyword={}, city={}", keyword, city, e);
        }
    }

    /**
     * 构建文本搜索缓存key
     */
    private String buildTextSearchKey(String keyword, String city) {
        String cityPart = (city != null && !city.isEmpty()) ? city : "all";
        return TEXT_SEARCH_CACHE_PREFIX + keyword + ":" + cityPart;
    }

    /**
     * 清空所有POI缓存
     */
    public void clearAllCache() {
        try {
            var keys = redisTemplate.keys(TEXT_SEARCH_CACHE_PREFIX + "*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("清空所有POI缓存: {} 个key", keys.size());
            }
        } catch (Exception e) {
            log.error("清空POI缓存失败", e);
        }
    }
}
