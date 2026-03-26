# Qwen API集成指南 - 旅行计划生成功能

## 功能概述

已完成旅行计划生成功能，集成了通义千问(Qwen) API，根据用户选择的目的地、POI和旅行偏好，智能生成个性化的旅行攻略。

## 实现内容

### 后端实现

#### 1. 配置文件 (application.yml)
```yaml
qwen:
  api-key: sk-d5e5e0e5c0f04e2c9e5e0e5c0f04e2c9  # 需要替换为真实的API Key
  api-url: https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
  model: qwen-plus
```

#### 2. DTO类
- **TripPlanRequest.java** - 请求数据结构
  - 目的地、日期、旅行者类型、旅行风格
  - 用户选择的酒店、景点、餐厅列表
  
- **TripPlanResponse.java** - 响应数据结构
  - AI生成的完整行程文本
  - 解析后的每日计划列表

#### 3. 服务层
- **QwenService.java** - Qwen API调用服务
  - 构建API请求
  - 调用Qwen API
  - 解析API响应
  
- **TripPlanService.java** - 行程生成服务
  - 构建智能Prompt
  - 调用Qwen服务
  - 解析AI生成的行程文本

#### 4. 控制器
- **TripPlanController.java**
  - `POST /api/trip/generate` - 生成旅行计划接口

### 前端实现

#### 1. 类型定义 (types.ts)
- TripPlanRequest - 请求类型
- TripPlanResponse - 响应类型
- DayPlanDetail - 每日计划
- ActivityDetail - 活动详情

#### 2. API服务 (api.ts)
- `generateTripPlan()` - 调用后端API生成行程

#### 3. 状态管理 (SelectionContext.tsx)
- 添加 `generatedPlan` 状态
- 添加 `setGeneratedPlan` 方法

#### 4. 页面更新
- **TripPlanner.tsx** - 实现真实的API调用
  - 收集用户输入
  - 构建请求数据
  - 调用API生成行程
  - 保存结果并跳转

- **Itinerary.tsx** - 显示生成的行程
  - 从context获取生成的计划
  - 展示每日行程
  - 支持多天切换

## Prompt工程

### Prompt结构

系统会根据用户输入自动构建详细的Prompt，包含：

1. **旅行基本信息**
   - 目的地
   - 出发/返程日期
   - 旅行天数
   - 旅行者类型
   - 旅行风格

2. **已选POI信息**
   - 酒店（含星级、地址）
   - 景点（含评级、地址）
   - 餐厅（含人均价格、地址）

3. **生成要求**
   - 根据旅行风格合理安排
   - 必须包含所有已选地点
   - 提供具体时间点
   - 包含描述和小贴士
   - 考虑距离和顺序
   - 适配旅行者类型

4. **输出格式要求**
   ```
   第X天 (日期)
   【时间】 活动名称
   描述：...
   建议时长：...
   小贴士：...
   ```

### Prompt示例

```
请为我制定一份详细的旅行计划。

【旅行基本信息】
目的地：福州市
出发日期：2024-06-01
返程日期：2024-06-03
旅行天数：3天
旅行者：情侣/夫妻
旅行风格：慢旅行

【已选酒店】
- 福州香格里拉大酒店（五星级），地址：福建省福州市鼓楼区...

【已选景点】
- 三坊七巷（AAAA级景区），地址：福建省福州市鼓楼区...
- 鼓山（AAAA级景区），地址：福建省福州市晋安区...

【已选餐厅】
- 聚春园（人均80元），地址：福建省福州市鼓楼区...

【生成要求】
1. 请根据我的旅行风格（慢旅行）合理安排每天的行程
2. 必须包含我已选择的所有地点（酒店、景点、餐厅）
3. 为每天的行程安排具体的时间点
4. 为每个活动提供简短的描述和实用的小贴士
5. 考虑景点之间的距离，合理安排游览顺序
6. 根据旅行者类型（情侣/夫妻）调整行程节奏

请按以下格式输出：
第X天 (日期)
【时间】 活动名称
描述：...
建议时长：...
小贴士：...
```

## 使用流程

### 1. 配置Qwen API Key

在 `application.yml` 中配置真实的API Key：

```yaml
qwen:
  api-key: 你的真实API Key
```

获取API Key：
1. 访问 https://dashscope.aliyun.com/
2. 注册/登录阿里云账号
3. 开通通义千问服务
4. 获取API Key

### 2. 启动应用

```bash
# 后端
./mvnw spring-boot:run

# 前端
cd voyager
npm run dev
```

### 3. 使用功能

1. **选择目的地**
   - 在Explore页面搜索并选择POI
   - 至少选择1个酒店、2个景点、2个餐厅

2. **规划行程**
   - 点击"规划行程"进入TripPlanner
   - Step 1: 确认选择的地点
   - Step 2: 选择出发和返程日期
   - Step 3: 选择旅行者类型
   - Step 4: 选择旅行风格

3. **生成行程**
   - 点击"AI生成行程"
   - 等待AI生成（通常5-15秒）
   - 自动跳转到Itinerary页面

4. **查看行程**
   - 查看AI生成的详细行程
   - 切换不同天数
   - 查看每个活动的时间、描述、小贴士

## API调用流程

```
前端 TripPlanner
    ↓ 用户点击"AI生成行程"
    ↓ 构建 TripPlanRequest
    ↓
API Service (api.ts)
    ↓ POST /api/trip/generate
    ↓
TripPlanController
    ↓ 接收请求
    ↓
TripPlanService
    ↓ 构建Prompt
    ↓
QwenService
    ↓ 调用Qwen API
    ↓ 解析响应
    ↓
TripPlanService
    ↓ 解析行程文本
    ↓ 构建响应对象
    ↓
返回 TripPlanResponse
    ↓
前端保存到Context
    ↓
跳转到 Itinerary 页面展示
```

## 数据结构

### 请求示例
```json
{
  "destination": "福州市",
  "startDate": "2024-06-01",
  "endDate": "2024-06-03",
  "travelers": "情侣/夫妻",
  "style": "慢旅行",
  "selectedPlaces": [
    {
      "id": "B001D2JQVS",
      "name": "福州香格里拉大酒店",
      "type": "hotel",
      "address": "福建省福州市鼓楼区...",
      "rating": 4.7,
      "starLevel": "五星级",
      "location": {
        "lat": 26.047,
        "lng": 119.246
      }
    }
  ]
}
```

### 响应示例
```json
{
  "itinerary": "第1天 (2024-06-01)\n【09:00】 入住酒店\n描述：...\n...",
  "dayPlans": [
    {
      "day": 1,
      "date": "2024-06-01",
      "subtitle": "慢旅行之旅",
      "activities": [
        {
          "id": "activity_123",
          "time": "09:00",
          "title": "入住酒店",
          "description": "办理入住手续，稍作休息",
          "type": "hotel",
          "image": "https://...",
          "duration": "1小时",
          "tip": "建议提前预约"
        }
      ]
    }
  ]
}
```

## 注意事项

### 1. API Key安全
- ⚠️ 不要将真实的API Key提交到Git
- 建议使用环境变量或配置中心
- 生产环境使用密钥管理服务

### 2. API调用限制
- Qwen API有调用频率限制
- 建议添加请求缓存
- 实现重试机制

### 3. 错误处理
- API调用失败时显示友好提示
- 记录详细错误日志
- 提供降级方案（模拟数据）

### 4. 性能优化
- AI生成通常需要5-15秒
- 前端显示加载动画
- 考虑添加超时处理

### 5. 内容解析
- AI返回的格式可能不完全一致
- 当前解析逻辑较简单
- 可以根据实际返回优化解析规则

## 扩展建议

### 1. 增强Prompt
- 添加天气信息
- 添加交通建议
- 添加预算控制
- 添加特殊需求（无障碍、亲子等）

### 2. 优化解析
- 使用更精确的正则表达式
- 支持更多格式变体
- 添加结构化输出要求

### 3. 功能扩展
- 支持行程编辑
- 支持导出PDF
- 支持分享到社交媒体
- 添加行程评价反馈

### 4. 智能优化
- 根据用户反馈优化Prompt
- 学习用户偏好
- 个性化推荐

## 故障排查

### Q1: API调用失败
- 检查API Key是否正确
- 检查网络连接
- 查看后端日志详细错误

### Q2: 生成的行程格式不对
- 检查Prompt是否完整
- 查看AI返回的原始文本
- 优化解析逻辑

### Q3: 生成时间过长
- 检查网络延迟
- 考虑使用更快的模型
- 添加超时处理

### Q4: 前端不显示行程
- 检查API响应是否成功
- 查看浏览器控制台错误
- 确认数据保存到Context

---

**完成时间**: 2026-03-26
**集成API**: 通义千问 (Qwen)
**状态**: ✅ 已完成，可投入使用
