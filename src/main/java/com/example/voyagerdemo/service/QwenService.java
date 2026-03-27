package com.example.voyagerdemo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class QwenService {
    
    @Value("${qwen.api-key}")
    private String apiKey;
    
    @Value("${qwen.api-url}")
    private String apiUrl;
    
    @Value("${qwen.model}")
    private String model;
    
    private final ObjectMapper objectMapper;
    
    /**
     * 调用Qwen API生成旅行攻略（OpenAI兼容格式）
     */
    public String generateTravelPlan(String prompt) {
        try {
            log.info("调用Qwen API生成旅行攻略（OpenAI兼容模式）");
            log.debug("Prompt: {}", prompt);
            
            // 构建请求体 - OpenAI兼容格式
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);
            
            // 构建messages数组
            ArrayNode messages = objectMapper.createArrayNode();
            
            // 系统消息
            ObjectNode systemMessage = objectMapper.createObjectNode();
            systemMessage.put("role", "system");
            systemMessage.put("content", "你是一个专业的旅行规划助手，擅长根据用户需求制定详细的旅行计划。你必须严格按照JSON格式输出，不要添加任何额外的文字说明。");
            messages.add(systemMessage);
            
            // 用户消息
            ObjectNode userMessage = objectMapper.createObjectNode();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);
            
            requestBody.set("messages", messages);
            
            // 参数设置
            requestBody.put("max_tokens", 3000);
            requestBody.put("temperature", 0.5);
            requestBody.put("enable_thinking", false);

            log.debug("请求体: {}", requestBody.toString());
            
            // 发送请求
            WebClient webClient = WebClient.builder()
                    .baseUrl(apiUrl)
                    .defaultHeader("Authorization", "Bearer " + apiKey)
                    .defaultHeader("Content-Type", "application/json")
                    .build();
            
            String response = webClient.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .map(body -> {
                                        log.error("API错误响应: {}", body);
                                        return new RuntimeException("API调用失败: " + body);
                                    }))
                    .bodyToMono(String.class)
                    .block();
            
            log.debug("Qwen API响应: {}", response);
            
            // 解析响应
            return parseOpenAIResponse(response);
            
        } catch (Exception e) {
            log.error("调用Qwen API失败", e);
            throw new RuntimeException("AI生成失败: " + e.getMessage());
        }
    }
    
    /**
     * 解析OpenAI兼容格式的响应
     */
    private String parseOpenAIResponse(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            
            // OpenAI格式: choices[0].message.content
            JsonNode choices = root.get("choices");
            if (choices != null && choices.isArray() && choices.size() > 0) {
                JsonNode firstChoice = choices.get(0);
                JsonNode message = firstChoice.get("message");
                if (message != null && message.has("content")) {
                    return message.get("content").asText();
                }
            }
            
            throw new RuntimeException("无法解析Qwen API响应");
            
        } catch (Exception e) {
            log.error("解析Qwen响应失败", e);
            throw new RuntimeException("解析AI响应失败: " + e.getMessage());
        }
    }
    
    /**
     * 清洗JSON字符串，去除markdown代码块包裹
     */
    public String cleanJson(String jsonStr) {
        if (jsonStr == null) {
            return null;
        }
        
        // 去除 ```json 和 ``` 包裹
        String cleaned = jsonStr.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        
        return cleaned.trim();
    }
}
