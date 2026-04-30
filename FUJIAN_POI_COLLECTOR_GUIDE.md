# 福建省POI批量采集功能使用指南

## 功能概述

这是一个批量采集系统，通过调用高德API一次性采集福建省9个城市的酒店、景点、美食POI数据并存入数据库。

### 采集策略
- **城市数量**: 9个（福州、厦门、泉州、漳州、莆田、龙岩、三明、南平、宁德）
- **POI类型**: 3种（酒店、景点、餐厅）
- **每种类型保存数量**: 6个高质量POI
- **总POI数量**: 9城市 × 3类型 × 6个 = 162条
- **API调用次数**: 54次（9城市 × 3类型 × 2页）
- **预计耗时**: 10-15分钟

### 数据质量控制
- 自动过滤子POI（停车场、入口、出口等）
- 按评分、图片、电话等维度排序
- 自动去重（基于高德ID）

## API接口说明

### 基础URL
```
http://localhost:8080/api/fujian-poi
```

### 1. 初始化福建省城市数据

**接口**: `POST /fujian-poi/init-regions`

**说明**: 向数据库插入福建省及9个城市的region数据（首次使用必须执行）

**请求示例**:
```bash
curl -X POST http://localhost:8080/api/fujian-poi/init-regions
```

**响应示例**:
```json
{
  "message": "初始化完成，共插入 9 个城市"
}
```

---

### 2. 采集所有城市POI（异步）

**接口**: `POST /fujian-poi/collect-all`

**说明**: 启动异步任务，采集所有9个城市的POI数据

**请求示例**:
```bash
curl -X POST http://localhost:8080/api/fujian-poi/collect-all
```

**响应示例**:
```json
{
  "message": "采集任务已启动",
  "tip": "请使用 GET /fujian-poi/status 查询采集进度"
}
```

---

### 3. 查询采集进度

**接口**: `GET /fujian-poi/status`

**说明**: 查询当前采集任务的进度和状态

**请求示例**:
```bash
curl http://localhost:8080/api/fujian-poi/status
```

**响应示例**:
```json
{
  "status": "running",
  "totalCities": 9,
  "completedCities": 3,
  "currentCity": "泉州市",
  "totalPois": 54,
  "startTime": "2026-03-30 10:30:00",
  "estimatedEndTime": "2026-03-30 10:45:00",
  "cityStatus": {
    "福州市": "completed",
    "厦门市": "completed",
    "泉州市": "processing",
    "漳州市": "pending"
  },
  "errorMessage": ""
}
```

**状态说明**:
- `idle`: 空闲，未开始
- `running`: 正在运行
- `completed`: 已完成
- `failed`: 失败

---

### 4. 查询统计信息

**接口**: `GET /fujian-poi/statistics`

**说明**: 查询已采集的POI统计数据

**请求示例**:
```bash
curl http://localhost:8080/api/fujian-poi/statistics
```

**响应示例**:
```json
{
  "totalPois": 162,
  "poiByCity": {
    "福州市": 18,
    "厦门市": 18,
    "泉州市": 18,
    "漳州市": 18,
    "莆田市": 18,
    "龙岩市": 18,
    "三明市": 18,
    "南平市": 18,
    "宁德市": 18
  },
  "poiByType": {
    "hotel": 54,
    "attraction": 54,
    "restaurant": 54
  },
  "lastUpdateTime": "2026-03-30 10:45:00"
}
```

---

### 5. 采集指定城市POI

**接口**: `POST /fujian-poi/collect-city?city={cityName}`

**说明**: 只采集指定城市的POI数据（用于增量更新）

**请求示例**:
```bash
curl -X POST "http://localhost:8080/api/fujian-poi/collect-city?city=福州市"
```

**响应示例**:
```json
{
  "message": "采集完成",
  "city": "福州市",
  "count": 18
}
```

---

### 6. 清空福建省POI数据

**接口**: `DELETE /fujian-poi/clear`

**说明**: 清空数据库中所有福建省的POI数据（用于重新采集）

**请求示例**:
```bash
curl -X DELETE http://localhost:8080/api/fujian-poi/clear
```

**响应示例**:
```json
{
  "message": "福建省POI数据已清空"
}
```

---

## 使用流程

### 首次执行（完整采集）

1. **启动Spring Boot应用**
   ```bash
   mvn spring-boot:run
   ```

2. **初始化城市数据**
   ```bash
   curl -X POST http://localhost:8080/api/fujian-poi/init-regions
   ```

3. **启动采集任务**
   ```bash
   curl -X POST http://localhost:8080/api/fujian-poi/collect-all
   ```

4. **查询采集进度**（每隔30秒查询一次）
   ```bash
   curl http://localhost:8080/api/fujian-poi/status
   ```

5. **等待完成后查看统计**
   ```bash
   curl http://localhost:8080/api/fujian-poi/statistics
   ```

### 增量更新（更新指定城市）

如果只想更新某个城市的数据：

```bash
curl -X POST "http://localhost:8080/api/fujian-poi/collect-city?city=福州市"
```

### 重新采集（清空后重新采集）

如果需要完全重新采集：

```bash
# 1. 清空现有数据
curl -X DELETE http://localhost:8080/api/fujian-poi/clear

# 2. 重新采集
curl -X POST http://localhost:8080/api/fujian-poi/collect-all
```

---

## 使用Postman测试

### 1. 导入接口集合

创建一个新的Collection，添加以下请求：

#### 初始化城市数据
- Method: POST
- URL: `http://localhost:8080/api/fujian-poi/init-regions`

#### 开始采集
- Method: POST
- URL: `http://localhost:8080/api/fujian-poi/collect-all`

#### 查询进度
- Method: GET
- URL: `http://localhost:8080/api/fujian-poi/status`

#### 查询统计
- Method: GET
- URL: `http://localhost:8080/api/fujian-poi/statistics`

---

## 数据库表结构

### region表
```sql
CREATE TABLE region (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    province VARCHAR(50) NOT NULL,
    city VARCHAR(50),
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### poi表
```sql
CREATE TABLE poi (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    region_id BIGINT NOT NULL,
    amap_id VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    address VARCHAR(500),
    location_lat DECIMAL(10, 7) NOT NULL,
    location_lng DECIMAL(10, 7) NOT NULL,
    rating DECIMAL(3, 1),
    tel VARCHAR(50),
    star_level VARCHAR(20),
    level VARCHAR(20),
    cost VARCHAR(20),
    photos TEXT,
    amap_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_region_amap_id (region_id, amap_id)
);
```

---

## 注意事项

1. **首次使用必须先执行初始化**
   - 必须先调用 `/init-regions` 接口初始化城市数据
   - 如果已经初始化过，重复调用不会重复插入

2. **采集任务是异步的**
   - 调用 `/collect-all` 后立即返回，任务在后台执行
   - 需要通过 `/status` 接口轮询查看进度
   - 预计耗时10-15分钟

3. **API调用限制**
   - 已设置200ms的调用间隔，避免触发高德API限流
   - 失败会自动重试3次（指数退避）

4. **数据去重**
   - 数据库有唯一约束 `uk_region_amap_id`
   - 重复采集同一城市时，已存在的POI会被跳过

5. **建议在低峰期执行**
   - 首次采集需要54次API调用
   - 建议在用户访问量较少的时段执行

6. **定期更新**
   - 建议每月更新一次数据
   - 可以使用 `/collect-city` 接口只更新特定城市

---

## 故障排查

### 问题1: 初始化失败
**错误**: "城市不存在"

**解决**: 确保先执行了 `/init-regions` 接口

---

### 问题2: 采集进度一直是0
**原因**: 可能是高德API调用失败

**排查步骤**:
1. 检查后端日志，查看API调用错误信息
2. 确认 `application.yml` 中的高德API Key是否正确
3. 检查网络连接是否正常

---

### 问题3: 采集的POI数量少于预期
**原因**: 某些城市的POI数据不足，或被过滤掉了

**说明**: 
- 系统会自动过滤子POI（停车场、入口等）
- 如果某个城市某种类型的POI不足6个，会保存实际数量
- 可以查看后端日志了解详细情况

---

## 后续扩展

如果需要采集其他省份的POI，可以参考以下步骤：

1. 在 `FujianPoiCollectorService` 中修改 `PROVINCE` 和 `CITIES` 常量
2. 创建新的Controller（如 `GuangdongPoiController`）
3. 调用相同的Service方法

或者将Service改造为通用的 `RegionPoiCollectorService`，支持任意省份。

---

## 技术架构

```
Controller (FujianPoiController)
    ↓
Service (FujianPoiCollectorService)
    ↓
AmapService (调用高德API)
    ↓
Repository (RegionRepository, PoiRepository)
    ↓
Database (MySQL)
```

---

## 相关文件

- **Entity**: `Region.java`, `Poi.java`
- **Repository**: `RegionRepository.java`, `PoiRepository.java`
- **Service**: `FujianPoiCollectorService.java`, `AmapService.java`
- **Controller**: `FujianPoiController.java`
- **DTO**: `CollectionStatusResponse.java`, `StatisticsResponse.java`
- **SQL**: `database/region_poi_tables.sql`
- **Spec**: `.kiro/specs/fujian-poi-collector.md`
