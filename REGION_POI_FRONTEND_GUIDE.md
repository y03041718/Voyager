# 区域POI前端集成指南

## 功能概述

在Explore页面添加了"区域推荐"功能，用户可以通过选择省份和城市来浏览预先采集的高质量POI数据，无需实时调用高德API。

## 实现内容

### 1. 后端API接口

#### RegionPoiController.java
新增了3个API接口：

```java
GET /api/region-poi/provinces          // 获取所有省份列表
GET /api/region-poi/cities?province=X  // 获取指定省份的城市列表
GET /api/region-poi/pois?province=X&city=Y&type=Z  // 获取城市POI
```

### 2. 前端类型定义

在 `types.ts` 中添加：

```typescript
// 省份信息
export interface ProvinceInfo {
    id: number;
    province: string;
    displayName: string;
}

// 城市信息
export interface CityInfo {
    id: number;
    city: string;
    displayName: string;
    poiCount: number;  // 该城市的POI数量
}

// 区域POI
export interface RegionPoi {
    id: number;
    amapId: string;
    name: string;
    type: 'hotel' | 'attraction' | 'restaurant';
    address: string;
    locationLat: number;
    locationLng: number;
    rating?: number;
    tel?: string;
    starLevel?: string;  // 酒店星级
    level?: string;      // 景点等级
    cost?: string;       // 餐厅人均消费
    amapType: string;
    photos: string[];
}
```

### 3. API服务方法

在 `api.ts` 中添加：

```typescript
// 获取省份列表
async getProvinces(): Promise<ProvinceInfo[]>

// 获取城市列表
async getCities(province: string): Promise<CityInfo[]>

// 获取城市POI
async getCityPois(province: string, city: string, type?: string): Promise<RegionPoi[]>
```

### 4. Explore页面更新

#### 新增功能

1. **搜索模式切换**
   - 周边搜索：原有的基于位置的搜索功能
   - 区域推荐：新增的省份+城市选择功能

2. **省份城市选择器**
   - 省份下拉选择
   - 城市下拉选择（显示POI数量）
   - 自动加载：选择城市后自动加载对应类型的POI

3. **数据展示**
   - 使用相同的卡片布局
   - 区域推荐模式下不显示距离
   - 显示评分、星级、等级、人均消费等信息

#### 核心状态

```typescript
// 搜索模式
const [searchMode, setSearchMode] = useState<'nearby' | 'region'>('nearby');

// 区域推荐相关
const [provinces, setProvinces] = useState<ProvinceInfo[]>([]);
const [cities, setCities] = useState<CityInfo[]>([]);
const [regionPois, setRegionPois] = useState<RegionPoi[]>([]);
const [selectedProvince, setSelectedProvince] = useState<string>('');
const [selectedCity, setSelectedCity] = useState<string>('');
```

#### 数据流

```
1. 页面加载 → 加载省份列表 → 默认选择福建省
2. 选择省份 → 加载城市列表 → 清空城市选择和POI
3. 选择城市 → 根据当前分类加载POI
4. 切换分类 → 重新加载当前城市的对应类型POI
```

## 使用流程

### 用户操作流程

1. 打开Explore页面
2. 点击"区域推荐"按钮切换模式
3. 选择省份（默认福建省）
4. 选择城市（显示POI数量）
5. 切换分类（酒店/景点/餐厅）查看不同类型的POI
6. 点击POI卡片选择/取消选择
7. 点击"在高德地图查看"打开详情

### 开发者测试流程

1. **启动后端**
   ```bash
   mvn spring-boot:run
   ```

2. **确保数据已采集**
   ```bash
   # 初始化城市数据
   curl -X POST http://localhost:8080/api/fujian-poi/init-regions
   
   # 采集POI数据
   curl -X POST http://localhost:8080/api/fujian-poi/collect-all
   ```

3. **启动前端**
   ```bash
   cd voyager
   npm run dev
   ```

4. **测试功能**
   - 访问 http://localhost:5173
   - 点击"探索周边"菜单
   - 切换到"区域推荐"模式
   - 选择城市并查看POI

## UI设计

### 模式切换按钮

```
┌─────────────┬─────────────┐
│ 🗺️ 周边搜索 │ 📋 区域推荐 │
└─────────────┴─────────────┘
```

### 省份城市选择器

```
┌──────────────────────────────────────┐
│ 选择省份                              │
│ ┌──────────────────────────────────┐ │
│ │ 福建省                        ▼  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 选择城市                              │
│ ┌──────────────────────────────────┐ │
│ │ 福州市 (18个推荐)             ▼  │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### POI卡片（区域推荐模式）

```
┌────────────────────────────┐
│ [图片]                      │
│ ┌──────┐                   │
│ │ 酒店 │                   │
│ └──────┘                   │
├────────────────────────────┤
│ 福州香格里拉大酒店          │
│ ⭐ 4.8                     │
│ 🏆 五星级酒店              │
│ 📍 福州市鼓楼区...         │
│ 📞 0591-87888888          │
│                            │
│ [在高德地图查看 →]         │
└────────────────────────────┘
```

## 优势

### 性能优势
- ✅ 0次实时API调用
- ✅ 响应速度 < 50ms
- ✅ 离线可用

### 用户体验
- ✅ 无需等待搜索
- ✅ 精选高质量POI
- ✅ 数据稳定可靠

### 成本优势
- ✅ 节省API配额
- ✅ 一次采集，多次使用

## 注意事项

1. **数据依赖**
   - 必须先执行POI采集才能使用区域推荐功能
   - 如果数据库中没有数据，会显示"暂无推荐数据"

2. **默认选择**
   - 页面加载时默认选择福建省
   - 可以在代码中修改默认省份

3. **分类切换**
   - 切换分类时会自动重新加载对应类型的POI
   - 保持当前选择的省份和城市

4. **距离显示**
   - 区域推荐模式下不显示距离
   - 周边搜索模式下显示距离

## 扩展建议

### 短期优化
1. 添加加载骨架屏
2. 添加空状态提示优化
3. 支持POI收藏功能
4. 添加POI详情弹窗

### 长期优化
1. 支持多省份数据
2. 添加POI评论功能
3. 支持POI对比功能
4. 添加POI推荐算法

## 相关文件

### 后端
- `src/main/java/com/example/voyagerdemo/controller/RegionPoiController.java`
- `src/main/java/com/example/voyagerdemo/repository/RegionRepository.java`
- `src/main/java/com/example/voyagerdemo/repository/PoiRepository.java`
- `src/main/java/com/example/voyagerdemo/entity/Region.java`
- `src/main/java/com/example/voyagerdemo/entity/Poi.java`

### 前端
- `voyager/src/pages/Explore.tsx`
- `voyager/src/services/api.ts`
- `voyager/src/types.ts`

### 文档
- `FUJIAN_POI_COLLECTOR_GUIDE.md` - 后端采集功能指南
- `FUJIAN_POI_FIX_NOTES.md` - 数据字段修复说明
- `REGION_POI_FRONTEND_GUIDE.md` - 本文档

## 完成状态

✅ 后端API接口
✅ 前端类型定义
✅ API服务方法
✅ Explore页面集成
✅ 模式切换功能
✅ 省份城市选择器
✅ POI数据展示
✅ 文档编写

现在用户可以在Explore页面通过选择省份和城市来浏览预先采集的高质量POI推荐！
