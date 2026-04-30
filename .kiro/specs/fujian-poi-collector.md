---
name: 福建省POI数据批量采集功能
status: design
created: 2026-03-30
---

# 福建省POI数据批量采集功能

## 概述
实现一个批量采集系统，通过调用高德API一次性采集福建省9个城市的酒店、景点、美食POI数据并存入数据库，减轻实时API调用负担，提升用户体验。

## 目标
- 采集福建省9个城市的POI数据（酒店、景点、餐厅）
- 预计采集约1350条高质量POI
- 总API调用次数：54次（9城市 × 3类型 × 2页）
- 提供管理接口用于数据采集和维护

## 设计

### 1. 数据库设计

#### 1.1 使用现有表结构
- `region` 表：存储省市信息
- `poi` 表：存储POI详细信息

#### 1.2 福建省城市列表
```sql
-- 需要插入的福建省region数据
INSERT INTO region (province, city, display_name) VALUES
('福建省', NULL, '福建省'),
('福建省', '福州市', '福州市'),
('福建省', '厦门市', '厦门市'),
('福建省', '泉州市', '泉州市'),
('福建省', '漳州市', '漳州市'),
('福建省', '莆田市', '莆田市'),
('福建省', '龙岩市', '龙岩市'),
('福建省', '三明市', '三明市'),
('福建省', '南平市', '南平市'),
('福建省', '宁德市', '宁德市');
```

### 2. 高德API调用方案

#### 2.1 API配置
- **端点**: `/v3/place/text`
- **方法**: GET
- **参数**:
  - `keywords`: 搜索关键词（酒店/景点/美食）
  - `city`: 城市名称
  - `types`: POI类型编码
  - `offset`: 每页数量（25）
  - `page`: 页码（1-2）

#### 2.2 POI类型映射
```java
hotel -> types=100000 (住宿服务)
attraction -> types=110000 (风景名胜)
restaurant -> types=050000 (餐饮服务)
```

#### 2.3 采集策略
- 每个城市每种类型：2页 × 25条 = 50条
- 每个城市：3种类型 × 50条 = 150条
- 9个城市：9 × 150 = 1350条
- API调用间隔：200ms（防止限流）

### 3. 数据处理流程

#### 3.1 去重策略
1. **高德ID去重**: 数据库约束 `uk_region_amap_id`
2. **名称+坐标去重**: 
   - 名称相同 && 坐标距离 < 50米 → 视为重复
3. **过滤子POI**: 排除包含以下关键词的POI
   - "停车场"、"北门"、"南门"、"东门"、"西门"
   - "入口"、"出口"、"售票处"、"游客中心"

#### 3.2 数据质量控制
优先级排序（保留高质量POI）：
1. 评分高的优先
2. 有图片的优先（photos不为空）
3. 有电话的优先（tel不为空）

数据清洗：
- 移除HTML标签
- 统一地址格式
- 验证坐标有效性（福建省范围：23°-28°N, 115°-120°E）

### 4. 后端架构设计

#### 4.1 新增Entity类

**RegionEntity.java**
```java
@Entity
@Table(name = "region")
class Region {
    Long id;
    String province;
    String city;
    String displayName;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

**PoiEntity.java**
```java
@Entity
@Table(name = "poi")
class Poi {
    Long id;
    Long regionId;
    String amapId;
    String name;
    String type; // hotel/attraction/restaurant
    String address;
    BigDecimal locationLat;
    BigDecimal locationLng;
    BigDecimal rating;
    String tel;
    String starLevel;
    String level;
    String cost;
    String photos; // JSON格式
    String amapType;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

#### 4.2 新增Repository

**RegionRepository.java**
```java
interface RegionRepository extends JpaRepository<Region, Long> {
    Optional<Region> findByProvinceAndCity(String province, String city);
    List<Region> findByProvince(String province);
}
```

**PoiRepository.java**
```java
interface PoiRepository extends JpaRepository<Poi, Long> {
    List<Poi> findByRegionIdAndType(Long regionId, String type);
    List<Poi> findByRegionId(Long regionId);
    boolean existsByRegionIdAndAmapId(Long regionId, String amapId);
    int countByRegionId(Long regionId);
}
```

#### 4.3 新增Service

**FujianPoiCollectorService.java**

核心方法：
1. `initializeFujianRegions()` - 初始化福建省城市数据
2. `collectAllPois()` - 采集所有城市POI（异步）
3. `collectCityPois(String cityName)` - 采集指定城市POI
4. `collectPoiByType(Long regionId, String cityName, String type)` - 按类型采集
5. `filterAndSavePois(Long regionId, List<AmapPOI> poiList, String type)` - 过滤并保存
6. `getCollectionStatus()` - 获取采集状态
7. `getStatistics()` - 获取统计信息
8. `clearFujianPois()` - 清空福建省POI数据

错误处理：
- API限流：每次请求间隔200ms
- 失败重试：最多3次，指数退避
- 日志记录：记录每个城市的采集结果
- 事务管理：按城市提交事务

#### 4.4 新增Controller

**FujianPoiController.java**

接口列表：
```
POST   /api/fujian-poi/init-regions      - 初始化福建省城市数据
POST   /api/fujian-poi/collect-all       - 采集所有城市POI（异步）
POST   /api/fujian-poi/collect-city      - 采集指定城市POI
GET    /api/fujian-poi/status            - 查询采集进度和状态
GET    /api/fujian-poi/statistics        - 查询采集统计信息
DELETE /api/fujian-poi/clear             - 清空福建省POI数据
```

#### 4.5 新增DTO

**CollectionStatusResponse.java**
```java
{
    String status; // running/completed/failed
    int totalCities;
    int completedCities;
    String currentCity;
    int totalPois;
    String startTime;
    String estimatedEndTime;
}
```

**StatisticsResponse.java**
```java
{
    int totalPois;
    Map<String, Integer> poiByCity;
    Map<String, Integer> poiByType;
    String lastUpdateTime;
}
```

### 5. 前端集成方案

#### 5.1 修改Explore页面
- 添加搜索模式切换：周边搜索 / 省份推荐
- 省份推荐模式下显示省份-城市选择器
- 选择城市后从数据库加载POI（不调用高德API）

#### 5.2 新增API接口（前端）
```typescript
// 获取福建省城市列表
getFujianCities(): Promise<RegionInfo[]>

// 获取指定城市的POI
getCityPois(cityName: string, type?: string): Promise<RegionPoi[]>
```

## 实现任务

### Task 1: 数据库初始化
- [ ] 确认 `region_poi_tables.sql` 已执行
- [ ] 插入福建省城市数据

### Task 2: 后端Entity和Repository
- [ ] 创建 `Region.java` Entity
- [ ] 创建 `Poi.java` Entity
- [ ] 创建 `RegionRepository.java`
- [ ] 创建 `PoiRepository.java`

### Task 3: 采集服务实现
- [ ] 创建 `FujianPoiCollectorService.java`
- [ ] 实现 `initializeFujianRegions()` 方法
- [ ] 实现 `collectPoiByType()` 方法（调用高德API）
- [ ] 实现去重和过滤逻辑
- [ ] 实现异步采集 `collectAllPois()`
- [ ] 实现状态跟踪和统计

### Task 4: 管理接口实现
- [ ] 创建 `FujianPoiController.java`
- [ ] 实现所有管理接口
- [ ] 添加权限控制（仅管理员可调用）
- [ ] 创建相关DTO类

### Task 5: 前端集成
- [ ] 修改 `Explore.tsx` 添加模式切换
- [ ] 创建省份-城市选择器组件
- [ ] 在 `api.ts` 中添加新接口
- [ ] 更新 `types.ts` 添加类型定义

### Task 6: 测试和优化
- [ ] 测试数据采集流程
- [ ] 验证去重逻辑
- [ ] 检查数据质量
- [ ] 性能优化

## 执行流程

### 首次执行
1. 调用 `POST /api/fujian-poi/init-regions` → 初始化region表数据
2. 调用 `POST /api/fujian-poi/collect-all` → 开始异步采集
3. 轮询 `GET /api/fujian-poi/status` → 查看采集进度
4. 调用 `GET /api/fujian-poi/statistics` → 查看采集结果统计

### 增量更新
1. 调用 `POST /api/fujian-poi/collect-city?city=福州市` → 只更新指定城市
2. 数据库自动去重（uk_region_amap_id约束）

## 预期效果

### 性能优势
- 用户浏览福建POI时：0次API调用
- 响应速度：数据库查询 < 50ms vs 高德API > 500ms
- 离线可用：不依赖高德API实时可用性

### 成本优势
- 每个用户浏览福建POI节省约100次API调用
- 一次采集，多次使用：1350条POI可服务所有用户

### 数据质量
- 精选数据：经过去重、过滤、排序
- 稳定性：不受API返回结果波动影响
- 可控性：可手动调整、补充数据

## 注意事项
1. 采集过程需要约10-15分钟（54次API调用 × 200ms间隔）
2. 建议在低峰期执行首次采集
3. 需要配置管理员权限才能调用采集接口
4. 定期更新数据（建议每月更新一次）
