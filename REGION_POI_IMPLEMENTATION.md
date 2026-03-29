# 省市推荐POI功能实现文档

## 功能概述

在现有的旅行规划系统基础上，新增"省市推荐POI"功能，用户可以通过选择省份和城市来查看该地区的推荐景点、酒店和餐厅。该功能与原有的高德地址周边搜索功能并存，互不影响。

## 一、数据库设计

### 1. region表（省市表）

```sql
CREATE TABLE region (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    province VARCHAR(50) NOT NULL,
    city VARCHAR(50),  -- 为NULL表示仅省级
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_province_city (province, city),
    INDEX idx_province (province)
);
```

**特点**：
- 支持"省+市"查询（city字段有值）
- 支持"仅省"查询（city字段为NULL）

### 2. poi表（POI推荐表）

```sql
CREATE TABLE poi (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    region_id BIGINT NOT NULL,
    amap_id VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- attraction/hotel/restaurant
    address VARCHAR(500),
    location_lat DECIMAL(10, 7) NOT NULL,
    location_lng DECIMAL(10, 7) NOT NULL,
    rating DECIMAL(3, 1),
    tel VARCHAR(50),
    star_level VARCHAR(20),  -- 酒店星级
    level VARCHAR(20),       -- 景点等级
    cost VARCHAR(20),        -- 人均消费
    photos TEXT,             -- JSON格式图片列表
    amap_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_region_amap_id (region_id, amap_id),
    INDEX idx_region_type (region_id, type),
    FOREIGN KEY (region_id) REFERENCES region(id) ON DELETE CASCADE
);
```

**特点**：
- 不存储距离信息（省市推荐不需要距离）
- 通过region_id关联省市
- 支持按类型查询

## 二、数据采集（初始化脚本）

### PoiInitService.java

**功能**：
1. 从region表读取所有省市
2. 使用高德"文本搜索API"批量采集POI数据
3. 每个城市采集24条数据（景点8条、酒店8条、餐厅8条）
4. 数据处理：
   - 去重（基于名称+经纬度）
   - 过滤子POI（如"XX公园北门"、"停车场"等）
5. 写入poi表

**使用方法**：

```bash
# 初始化所有区域的POI数据
POST /api/regions/init-all

# 初始化指定区域的POI数据
POST /api/regions/init/{regionId}
```

**注意事项**：
- 首次运行需要较长时间
- 建议在服务器空闲时运行
- 已有数据的区域会自动跳过

## 三、后端API

### 1. 查询省份列表

```
GET /api/regions/provinces
```

**响应**：
```json
["京都府", "大阪府", "东京都", "北海道"]
```

### 2. 查询城市列表

```
GET /api/regions/cities?province=京都府
```

**响应**：
```json
[
  {
    "id": 1,
    "province": "京都府",
    "city": "京都市",
    "displayName": "京都市"
  }
]
```

### 3. 查询POI列表（所有类型）

```
GET /api/regions/pois?province=京都府&city=京都市
```

**响应**：
```json
{
  "hotels": [...],
  "attractions": [...],
  "restaurants": [...]
}
```

### 4. 查询指定类型POI

```
GET /api/regions/pois/{type}?province=京都府&city=京都市
```

type可选值：`hotel`, `attraction`, `restaurant`

## 四、前端实现

### 1. 新增组件：RegionSelector

**位置**：`voyager/src/components/RegionSelector.tsx`

**功能**：
- 省份下拉选择
- 城市下拉选择（可选）
- 支持"全省"选项

**使用示例**：
```tsx
<RegionSelector 
  onSelect={(province, city) => {
    // 处理选择
  }}
/>
```

### 2. 更新Explore页面

**新增功能**：
- 搜索模式切换（周边搜索 / 省市推荐）
- 省市推荐模式下不显示距离
- 两种模式的搜索结果互不干扰

**UI变化**：
- 顶部新增模式切换按钮
- 省市推荐模式显示RegionSelector
- 周边搜索模式显示SmartSearch

### 3. 类型定义

**新增类型**（`voyager/src/types.ts`）：
```typescript
export interface RegionInfo {
    id: number;
    province: string;
    city?: string;
    displayName: string;
}

export interface RegionPoi {
    id: number;
    amapId: string;
    name: string;
    type: 'hotel' | 'attraction' | 'restaurant';
    address?: string;
    location: { lat: number; lng: number };
    rating?: number;
    tel?: string;
    starLevel?: string;
    level?: string;
    cost?: string;
    photos?: string[];
    amapType?: string;
}

export interface RegionPoisResponse {
    hotels: RegionPoi[];
    attractions: RegionPoi[];
    restaurants: RegionPoi[];
}
```

## 五、使用流程

### 管理员初始化数据

1. 执行数据库脚本创建表：
```bash
mysql -u root -p < database/region_poi_tables.sql
```

2. 启动后端服务

3. 调用初始化接口：
```bash
curl -X POST http://localhost:8080/api/regions/init-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. 等待数据采集完成（可能需要几分钟）

### 用户使用

1. 打开探索页面
2. 点击"省市推荐"按钮
3. 选择省份（如"京都府"）
4. 选择城市（可选，如"京都市"）
5. 查看推荐的POI列表
6. 选择感兴趣的POI添加到行程

## 六、与原有功能的关系

### 保留的功能
- 高德地址周边搜索（SmartSearch组件）
- 关键词搜索
- 距离计算和显示

### 新增的功能
- 省市推荐POI
- 搜索模式切换
- 省市二级选择

### 互不影响
- 两种搜索模式独立运行
- 搜索结果分别存储
- UI根据模式动态调整

## 七、注意事项

1. **数据初始化**：首次使用需要初始化POI数据
2. **API限制**：高德API有调用频率限制，初始化时注意控制速度
3. **数据更新**：POI数据可能过时，建议定期重新初始化
4. **权限控制**：初始化接口应该只对管理员开放
5. **错误处理**：网络异常时应有友好的错误提示

## 八、后续优化建议

1. **增量更新**：支持单个POI的更新而不是全量重新采集
2. **数据审核**：添加人工审核机制，确保推荐质量
3. **热度排序**：根据用户选择频率排序POI
4. **图片优化**：使用CDN加速图片加载
5. **缓存机制**：对热门省市的POI数据进行缓存
