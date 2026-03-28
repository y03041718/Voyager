# 路线地图不显示问题修复指南

## 问题描述
用户报告行程页面的路线地图显示"暂无位置信息"，前端日志显示：
- `第一个计划是否有location字段: undefined`
- `位置信息数量: 0`

## 根本原因
后端在填充POI数据时，**没有设置location字段**，导致前端无法获取位置信息来渲染地图。

## 修复方案

### 1. 后端修复（已完成）✅

修改 `TripPlanService.java` 的 `enrichWithPoiData()` 方法，添加设置location的代码：

```java
// ✅ 设置位置信息
if (poi.getLocation() != null && poi.getLocation().getLat() != null && poi.getLocation().getLng() != null) {
    TravelPlanResponse.Location location = new TravelPlanResponse.Location();
    location.setLat(poi.getLocation().getLat());
    location.setLng(poi.getLocation().getLng());
    plan.setLocation(location);
    plansWithLocation++;
    log.debug("✅ 已设置位置信息: {} (lat={}, lng={})", 
        plan.getName(), location.getLat(), location.getLng());
} else {
    log.warn("⚠️ POI没有位置信息: {} (id={})", poi.getName(), poi.getId());
}
```

### 2. 数据结构确认（已完成）✅

- `TravelPlanResponse.Plan` 类有 `location` 字段 ✅
- `TripPlanRequest.SelectedPlace` 类有 `location` 字段 ✅
- 前端 `TravelPlan` 接口有 `location` 字段 ✅

### 3. 重要说明

项目中**没有TripPlan实体类和TripPlanRepository**，这是正常的设计：
- TripPlanService 不保存行程到数据库
- 只是根据用户请求实时生成并返回行程数据
- 行程数据存储在前端（localStorage或状态管理）

## 测试步骤

### 1. 重启后端服务
```bash
cd /path/to/project
mvn spring-boot:run
```

### 2. 生成新的行程
- 旧的行程数据没有location字段，必须生成新行程
- 在前端"行程规划"页面重新生成一个行程

### 3. 查看后端日志
应该看到类似的日志：
```
✅ 已设置位置信息: 清水寺 (lat=34.994857, lng=135.785004)
✅ 已设置位置信息: 金阁寺 (lat=35.039705, lng=135.729243)
📍 位置信息统计: 8/10 个计划有位置信息
```

### 4. 查看前端日志
在浏览器控制台应该看到：
```
第一个计划是否有location字段: true
有位置信息的计划: (8) [{...}, {...}, ...]
位置信息数量: 8
```

### 5. 验证地图显示
- 行程页面右侧应该显示路线地图
- 地图上应该标记所有景点（带序号和名称）
- 应该显示蓝色的路线轨迹
- 底部应该显示总距离和预计时间

## 常见问题

### Q: 为什么旧行程还是不显示地图？
A: 旧行程的数据结构中没有location字段，必须生成新行程。可以在前端清除localStorage或重新生成行程。

### Q: 部分景点没有位置信息怎么办？
A: 检查后端日志中的"⚠️ POI没有位置信息"警告，确认是哪些POI缺少位置数据。通常是因为：
- 用户手动添加的POI没有提供location
- 高德API返回的POI数据不完整

### Q: 地图显示但没有路线？
A: 检查是否有至少2个有位置信息的景点。如果只有1个景点，无法规划路线。

## 相关文件

- `src/main/java/com/example/voyagerdemo/service/TripPlanService.java` - 后端服务（已修复）
- `src/main/java/com/example/voyagerdemo/dto/TravelPlanResponse.java` - 响应DTO
- `voyager/src/types.ts` - 前端类型定义
- `voyager/src/pages/Itinerary.tsx` - 行程页面
- `voyager/src/components/RouteMap.tsx` - 地图组件

## 修复时间线

1. 用户报告问题：地图不显示
2. 发现问题：`enrichWithPoiData()` 没有设置location
3. 修复代码：添加location设置逻辑和统计日志
4. 测试验证：重启后端 → 生成新行程 → 查看地图
