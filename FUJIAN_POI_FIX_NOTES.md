# 福建POI采集功能修复说明

## 修复的问题

### 问题描述
采集入库的POI数据缺少以下字段：
1. 所有POI都没有评分（rating）
2. 餐厅没有人均消费（cost）
3. 酒店没有星级（starLevel）
4. 景点没有等级（level）

### 根本原因
在 `FujianPoiCollectorService.java` 的 `convertToPoi()` 方法中，只保存了基本字段（名称、地址、坐标、电话、图片），但遗漏了以下字段的赋值：
- `rating` - 评分
- `starLevel` - 酒店星级
- `level` - 景点等级
- `cost` - 餐厅人均消费

### 修复内容

#### 1. 修复 `convertToPoi()` 方法
**文件**: `src/main/java/com/example/voyagerdemo/service/FujianPoiCollectorService.java`

**修改前**:
```java
private Poi convertToPoi(Long regionId, AmapPOI amapPoi, String type) {
    Poi poi = new Poi();
    poi.setRegionId(regionId);
    poi.setAmapId(amapPoi.getId());
    poi.setName(amapPoi.getName());
    poi.setType(type);
    poi.setAddress(amapPoi.getAddress());
    
    // 解析坐标
    poi.setLocationLng(new BigDecimal(location[0]));
    poi.setLocationLat(new BigDecimal(location[1]));
    
    poi.setTel(amapPoi.getTel());
    poi.setAmapType(amapPoi.getType());
    
    // 处理photos
    if (amapPoi.getPhotos() != null && !amapPoi.getPhotos().isEmpty()) {
        poi.setPhotos(String.join(",", amapPoi.getPhotos()));
    }
    
    return poi;
}
```

**修改后**:
```java
private Poi convertToPoi(Long regionId, AmapPOI amapPoi, String type) {
    Poi poi = new Poi();
    poi.setRegionId(regionId);
    poi.setAmapId(amapPoi.getId());
    poi.setName(amapPoi.getName());
    poi.setType(type);
    poi.setAddress(amapPoi.getAddress());
    
    // 解析坐标
    poi.setLocationLng(new BigDecimal(location[0]));
    poi.setLocationLat(new BigDecimal(location[1]));
    
    // ✅ 新增：评分
    if (amapPoi.getRating() != null) {
        poi.setRating(BigDecimal.valueOf(amapPoi.getRating()));
    }
    
    poi.setTel(amapPoi.getTel());
    poi.setAmapType(amapPoi.getType());
    
    // ✅ 新增：酒店星级
    if (amapPoi.getStarLevel() != null && !amapPoi.getStarLevel().isEmpty()) {
        poi.setStarLevel(amapPoi.getStarLevel());
    }
    
    // ✅ 新增：景点等级
    if (amapPoi.getLevel() != null && !amapPoi.getLevel().isEmpty()) {
        poi.setLevel(amapPoi.getLevel());
    }
    
    // ✅ 新增：餐厅人均消费
    if (amapPoi.getCost() != null && !amapPoi.getCost().isEmpty()) {
        poi.setCost(amapPoi.getCost());
    }
    
    // 处理photos
    if (amapPoi.getPhotos() != null && !amapPoi.getPhotos().isEmpty()) {
        poi.setPhotos(String.join(",", amapPoi.getPhotos()));
    }
    
    return poi;
}
```

#### 2. 修复 `parseRating()` 方法
**文件**: `src/main/java/com/example/voyagerdemo/service/FujianPoiCollectorService.java`

**修改前**:
```java
private double parseRating(AmapPOI poi) {
    // 这里需要根据AmapPOI的实际字段来解析评分
    // 暂时返回0，后续根据实际情况调整
    return 0.0;
}
```

**修改后**:
```java
private double parseRating(AmapPOI poi) {
    if (poi.getRating() != null) {
        return poi.getRating();
    }
    return 0.0;
}
```

### 数据来源说明

这些字段的数据来自高德API的响应，在 `AmapService.parsePOIResponse()` 方法中已经正确解析：

1. **rating（评分）**: 
   - 来源：高德API的 `rating` 字段或 `biz_ext.rating` 字段
   - 类型：Double（如 4.5）

2. **cost（人均消费）**:
   - 来源：高德API的 `cost` 字段或 `biz_ext.cost` 字段
   - 类型：String（如 "50元"）

3. **starLevel（酒店星级）**:
   - 来源：高德API的 `keytag` 字段
   - 类型：String（如 "五星级酒店"）

4. **level（景点等级）**:
   - 来源：高德API的 `keytag` 字段
   - 类型：String（如 "AAAAA级景区"）

### 验证方法

修复后，重新采集数据并验证：

```bash
# 1. 清空现有数据
curl -X DELETE http://localhost:8080/api/fujian-poi/clear

# 2. 重新采集
curl -X POST http://localhost:8080/api/fujian-poi/collect-all

# 3. 查询数据库验证
SELECT 
    name, 
    type, 
    rating, 
    star_level, 
    level, 
    cost 
FROM poi 
WHERE region_id IN (
    SELECT id FROM region WHERE province = '福建省'
)
LIMIT 20;
```

### 预期结果

修复后，数据库中的POI应该包含：
- **酒店**: name, address, tel, rating, star_level, photos
- **景点**: name, address, tel, rating, level, photos
- **餐厅**: name, address, tel, rating, cost, photos

### 注意事项

1. **高德API数据完整性**
   - 并非所有POI都有评分、星级、等级或人均消费
   - 这取决于高德地图的数据完整性
   - 如果高德API返回的数据中没有这些字段，数据库中也会是NULL

2. **数据质量排序**
   - 修复后，排序逻辑会正确工作
   - 有评分的POI会排在前面
   - 评分相同时，有图片的优先
   - 再相同时，有电话的优先

3. **已采集的数据**
   - 修复前采集的数据不会自动更新
   - 需要清空数据后重新采集
   - 或者使用 `/collect-city` 接口更新指定城市

### 相关文件

- `src/main/java/com/example/voyagerdemo/service/FujianPoiCollectorService.java` - 修复convertToPoi和parseRating方法
- `src/main/java/com/example/voyagerdemo/service/AmapService.java` - 已正确解析高德API数据（无需修改）
- `src/main/java/com/example/voyagerdemo/dto/AmapPOI.java` - DTO定义（无需修改）
- `src/main/java/com/example/voyagerdemo/entity/Poi.java` - 实体类（无需修改）

### 修复时间
2026-03-30

### 修复状态
✅ 已完成
