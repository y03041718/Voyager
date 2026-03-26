package com.example.voyagerdemo.service;

import com.example.voyagerdemo.dto.AmapPOI;
import com.example.voyagerdemo.dto.AmapSearchSuggestion;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AmapService {

    @Value("${amap.key}")
    private String amapKey;

    @Value("${amap.base-url}")
    private String baseUrl;

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    /**
     * 获取搜索建议
     */
    public List<AmapSearchSuggestion> getSearchSuggestions(String keyword) {
        try {
            WebClient webClient = webClientBuilder.build();

            String response = webClient.get()
                    .uri(baseUrl + "/assistant/inputtips?key={key}&keywords={keywords}&type=&location=&city=&datatype=all&citylimit=false",
                            amapKey, keyword)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseSearchSuggestions(response);
        } catch (Exception e) {
            log.error("获取搜索建议失败: {}", keyword, e);
            return new ArrayList<>();
        }
    }

    /**
     * POI搜索
     */
    public List<AmapPOI> searchPOI(String keyword, String city, String types) {
        try {
            WebClient webClient = webClientBuilder.build();

            String url = baseUrl + "/place/text?key={key}&keywords={keywords}&types={types}&city={city}&children=0&offset=9&page=1&extensions=all";

            log.info("开始POI搜索 - keyword: {}, city: {}, types: {}", keyword, city, types);

            String response = webClient.get()
                    .uri(url, amapKey, keyword, types != null ? types : "", city != null ? city : "")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("高德API响应: {}", response);

            List<AmapPOI> result = parsePOIResponse(response);
            log.info("解析得到 {} 个POI", result.size());

            return result;
        } catch (Exception e) {
            log.error("POI搜索失败: keyword={}, city={}, types={}", keyword, city, types, e);
            return new ArrayList<>();
        }
    }

    /**
     * 周边搜索
     */
    public List<AmapPOI> getNearbyPOI(Double lat, Double lng, String types, Integer radius) {
        try {
            WebClient webClient = webClientBuilder.build();

            String location = lng + "," + lat; // 高德地图使用经度,纬度的格式

            String response = webClient.get()
                    .uri(baseUrl + "/place/around?key={key}&location={location}&types={types}&radius={radius}&offset=9&page=1&extensions=all",
                            amapKey, location, types, radius)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parsePOIResponse(response);
        } catch (Exception e) {
            log.error("周边搜索失败: lat={}, lng={}", lat, lng, e);
            return new ArrayList<>();
        }
    }

    private List<AmapSearchSuggestion> parseSearchSuggestions(String response) {
        List<AmapSearchSuggestion> suggestions = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode tips = root.get("tips");

            if (tips != null && tips.isArray()) {
                for (JsonNode tip : tips) {
                    AmapSearchSuggestion suggestion = new AmapSearchSuggestion();
                    suggestion.setId(tip.get("id").asText());
                    suggestion.setName(tip.get("name").asText());
                    suggestion.setDistrict(tip.get("district").asText());
                    suggestion.setAddress(tip.get("address").asText());

                    // 解析位置信息
                    String locationStr = tip.get("location").asText();
                    if (!locationStr.isEmpty() && !locationStr.equals("[]")) {
                        String[] coords = locationStr.split(",");
                        if (coords.length == 2) {
                            AmapSearchSuggestion.Location location = new AmapSearchSuggestion.Location();
                            location.setLng(Double.parseDouble(coords[0]));
                            location.setLat(Double.parseDouble(coords[1]));
                            suggestion.setLocation(location);
                        }
                    }

                    suggestions.add(suggestion);
                }
            }
        } catch (Exception e) {
            log.error("解析搜索建议响应失败", e);
        }

        return suggestions;
    }

    private List<AmapPOI> parsePOIResponse(String response) {
        List<AmapPOI> pois = new ArrayList<>();

        try {
            log.debug("开始解析POI响应");
            JsonNode root = objectMapper.readTree(response);

            // 检查API状态
            String status = root.has("status") ? root.get("status").asText() : "unknown";
            log.info("高德API状态: {}", status);

            if (!"1".equals(status)) {
                String info = root.has("info") ? root.get("info").asText() : "未知错误";
                log.error("高德API返回错误: {}", info);
                return pois;
            }

            JsonNode poisNode = root.get("pois");

            if (poisNode != null && poisNode.isArray()) {
                log.info("找到 {} 个POI", poisNode.size());

                for (JsonNode poi : poisNode) {
                    try {
                        AmapPOI amapPOI = new AmapPOI();
                        amapPOI.setId(poi.has("id") ? poi.get("id").asText() : "");
                        amapPOI.setName(poi.has("name") ? poi.get("name").asText() : "");
                        amapPOI.setType(poi.has("type") ? poi.get("type").asText() : "");
                        amapPOI.setAddress(poi.has("address") ? poi.get("address").asText() : "");

                        // 电话
                        if (poi.has("tel") && !poi.get("tel").asText().isEmpty()) {
                            amapPOI.setTel(poi.get("tel").asText());
                        }

                        // 距离（如果API返回了distance字段）
                        if (poi.has("distance") && !poi.get("distance").asText().isEmpty()) {
                            try {
                                amapPOI.setDistance(Integer.parseInt(poi.get("distance").asText()));
                            } catch (NumberFormatException e) {
                                log.warn("距离解析失败: {}", poi.get("distance").asText());
                            }
                        }

                        // keytag字段：包含星级（酒店）或评级（景点）
                        if (poi.has("keytag") && !poi.get("keytag").asText().isEmpty()) {
                            String keytag = poi.get("keytag").asText();
                            log.debug("POI {} 的keytag: {}", amapPOI.getName(), keytag);
                            amapPOI.setStarLevel(keytag); // 酒店用
                            amapPOI.setLevel(keytag); // 景点用
                        }

                        // cost字段：餐厅人均价格
                        if (poi.has("cost") && !poi.get("cost").asText().isEmpty()) {
                            String cost = poi.get("cost").asText();
                            log.debug("POI {} 的cost: {}", amapPOI.getName(), cost);
                            amapPOI.setCost(cost);
                        }

                        // rating字段：评分
                        if (poi.has("rating") && !poi.get("rating").asText().isEmpty()) {
                            try {
                                Double rating = Double.parseDouble(poi.get("rating").asText());
                                log.debug("POI {} 的rating: {}", amapPOI.getName(), rating);
                                amapPOI.setRating(rating);
                            } catch (NumberFormatException e) {
                                log.warn("评分解析失败: {}", poi.get("rating").asText());
                            }
                        }

                        // 如果有biz_ext扩展信息，也尝试从中提取
                        if (poi.has("biz_ext")) {
                            JsonNode bizExt = poi.get("biz_ext");

                            // 从biz_ext中提取rating
                            if (bizExt.has("rating") && !bizExt.get("rating").asText().isEmpty() && amapPOI.getRating() == null) {
                                try {
                                    amapPOI.setRating(Double.parseDouble(bizExt.get("rating").asText()));
                                } catch (NumberFormatException e) {
                                    log.warn("biz_ext评分解析失败: {}", bizExt.get("rating").asText());
                                }
                            }

                            // 从biz_ext中提取cost
                            if (bizExt.has("cost") && !bizExt.get("cost").asText().isEmpty() && amapPOI.getCost() == null) {
                                amapPOI.setCost(bizExt.get("cost").asText());
                            }
                        }

                        // 解析位置信息
                        if (poi.has("location")) {
                            String locationStr = poi.get("location").asText();
                            if (!locationStr.isEmpty()) {
                                String[] coords = locationStr.split(",");
                                if (coords.length == 2) {
                                    AmapPOI.Location location = new AmapPOI.Location();
                                    location.setLng(Double.parseDouble(coords[0]));
                                    location.setLat(Double.parseDouble(coords[1]));
                                    amapPOI.setLocation(location);
                                }
                            }
                        }

                        // 解析照片
                        if (poi.has("photos")) {
                            JsonNode photos = poi.get("photos");
                            List<String> photoList = new ArrayList<>();
                            if (photos.isArray() && photos.size() > 0) {
                                for (JsonNode photo : photos) {
                                    if (photo.has("url")) {
                                        photoList.add(photo.get("url").asText());
                                    }
                                }
                            }
                            if (!photoList.isEmpty()) {
                                amapPOI.setPhotos(photoList);
                            }
                        }

                        pois.add(amapPOI);
                        log.debug("成功解析POI: {}", amapPOI.getName());
                    } catch (Exception e) {
                        log.error("解析单个POI失败", e);
                    }
                }
            } else {
                log.warn("响应中没有pois数组");
            }
        } catch (Exception e) {
            log.error("解析POI响应失败", e);
        }

        log.info("最终解析得到 {} 个POI", pois.size());
        return pois;
    }

    /**
     * 计算两点之间的距离（使用高德距离测量API）
     * @param origins 起点坐标 "经度,纬度"
     * @param destination 终点坐标 "经度,纬度"
     * @return 距离（米）
     */
    public Integer calculateDistance(String origins, String destination) {
        try {
            WebClient webClient = webClientBuilder.build();

            String response = webClient.get()
                    .uri(baseUrl + "/distance?key={key}&origins={origins}&destination={destination}&type=1",
                            amapKey, origins, destination)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseDistanceResponse(response);
        } catch (Exception e) {
            log.error("距离计算失败: origins={}, destination={}", origins, destination, e);
            return null;
        }
    }

    /**
     * 批量计算距离
     * @param originLat 起点纬度
     * @param originLng 起点经度
     * @param pois POI列表
     * @return 更新了距离的POI列表
     */
    public List<AmapPOI> calculateDistancesForPOIs(Double originLat, Double originLng, List<AmapPOI> pois) {
        if (originLat == null || originLng == null || pois.isEmpty()) {
            return pois;
        }

        String origin = originLng + "," + originLat;

        for (AmapPOI poi : pois) {
            if (poi.getLocation() != null && poi.getDistance() == null) {
                String destination = poi.getLocation().getLng() + "," + poi.getLocation().getLat();
                Integer distance = calculateDistance(origin, destination);
                if (distance != null) {
                    poi.setDistance(distance);
                }
            }
        }

        return pois;
    }

    private Integer parseDistanceResponse(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);

            String status = root.has("status") ? root.get("status").asText() : "unknown";
            if (!"1".equals(status)) {
                log.error("距离计算API返回错误: {}", root.has("info") ? root.get("info").asText() : "未知错误");
                return null;
            }

            JsonNode results = root.get("results");
            if (results != null && results.isArray() && results.size() > 0) {
                JsonNode firstResult = results.get(0);
                if (firstResult.has("distance")) {
                    String distanceStr = firstResult.get("distance").asText();
                    try {
                        return Integer.parseInt(distanceStr);
                    } catch (NumberFormatException e) {
                        log.warn("距离值解析失败: {}", distanceStr);
                    }
                }
            }
        } catch (Exception e) {
            log.error("解析距离响应失败", e);
        }

        return null;
    }
}