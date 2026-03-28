# 路线地图功能使用指南

## 功能概述

路线地图功能集成了高德地图API，可以在行程页面展示交互式路线地图，包括：

- 📍 标记所有景点、餐厅位置
- 🗺️ 自动规划最优路线
- 📏 显示总距离和预计时间
- 🔍 支持地图缩放、拖拽
- 🖥️ 支持全屏查看

## 配置步骤

### 1. 申请高德地图API Key

1. 访问 [高德开放平台](https://console.amap.com/)
2. 注册/登录账号
3. 进入"应用管理" -> "我的应用"
4. 创建新应用
5. 添加Key：
   - **Key名称**：自定义（如：Voyager前端）
   - **服务平台**：选择"Web端(JS API)"
   - **白名单**：开发环境可填 `*`，生产环境填实际域名

### 2. 配置后端API Key

在 `src/main/resources/application.yml` 中配置：

```yaml
amap:
  key: YOUR_AMAP_SERVER_KEY  # 后端使用的Web服务API Key
  base-url: https://restapi.amap.com/v3
```

### 3. 配置前端API Key

在 `voyager/.env` 文件中添加：

```env
VITE_AMAP_KEY=YOUR_AMAP_WEB_KEY
```

注意：前端和后端需要使用不同的Key：
- **后端**：Web服务API Key（用于服务端调用）
- **前端**：Web端(JS API) Key（用于浏览器端地图展示）

### 4. 安全配置（可选）

如果启用了安全密钥，在 `RouteMap.tsx` 中配置：

```typescript
window._AMapSecurityConfig = {
  securityJsCode: 'YOUR_SECURITY_CODE',
};
```

## API接口说明

### 后端接口

#### 1. 两点路线规划
```
GET /api/amap/directions
参数:
  - origin: 起点坐标 "经度,纬度"
  - destination: 终点坐标 "经度,纬度"
  - strategy: 路线策略 (0-速度优先, 1-费用优先, 2-距离优先, 3-不走高速)
```

#### 2. 多点路线规划
```
POST /api/amap/directions/multi
Body: ["经度1,纬度1", "经度2,纬度2", ...]
```

#### 3. 生成静态地图
```
POST /api/amap/static-map
参数:
  - width: 图片宽度 (默认800)
  - height: 图片高度 (默认600)
Body: ["经度1,纬度1", "经度2,纬度2", ...]
```

### 前端组件

#### RouteMap 组件

```tsx
import RouteMap from '../components/RouteMap';

<RouteMap 
  waypoints={[
    { name: '清水寺', location: { lat: 34.9949, lng: 135.7850 } },
    { name: '金阁寺', location: { lat: 35.0394, lng: 135.7292 } }
  ]}
  onRouteCalculated={(distance, duration) => {
    console.log(`距离: ${distance}km, 时间: ${duration}分钟`);
  }}
/>
```

## 功能特性

### 1. 自动路线规划

- 支持2个及以上途经点
- 自动计算最优路线
- 显示路线轨迹和导航指引

### 2. 交互功能

- 地图缩放、拖拽
- 点击标记查看详情
- 全屏查看模式

### 3. 路线信息

- 总距离（公里）
- 预计时间（分钟）
- 实时更新

### 4. 打印支持

地图组件在打印时会自动隐藏交互按钮，保留核心信息。

## 使用场景

### 1. 行程页面

在 `Itinerary.tsx` 中自动展示当天所有景点的路线：

```tsx
const mapWaypoints = currentDayPlan.plans
  .filter(plan => plan.location)
  .map(plan => ({
    name: plan.name,
    location: plan.location
  }));

<RouteMap waypoints={mapWaypoints} />
```

### 2. 路线预览

在生成行程前预览路线：

```tsx
<RouteMap 
  waypoints={selectedDestinations.map(d => ({
    name: d.name,
    location: d.location
  }))}
/>
```

## 常见问题

### Q1: 地图加载失败？

**原因**：
- API Key未配置或无效
- 网络连接问题
- Key的服务平台类型不匹配

**解决**：
1. 检查 `.env` 文件中的 `VITE_AMAP_KEY`
2. 确认Key类型为"Web端(JS API)"
3. 检查浏览器控制台错误信息

### Q2: 路线规划失败？

**原因**：
- 坐标格式错误（应为"经度,纬度"）
- 途经点数量不足（至少2个）
- 后端API Key配置错误

**解决**：
1. 检查坐标格式
2. 确认至少有2个有效位置
3. 查看后端日志

### Q3: 距离和时间不显示？

**原因**：
- 路线规划API调用失败
- 回调函数未正确设置

**解决**：
1. 打开浏览器控制台查看错误
2. 确认 `onRouteCalculated` 回调已设置

### Q4: 地图样式异常？

**原因**：
- CSS冲突
- 容器尺寸未设置

**解决**：
1. 确保容器有明确的高度
2. 检查CSS样式是否被覆盖

## 性能优化

### 1. 懒加载

地图脚本仅在需要时加载，不影响页面初始加载速度。

### 2. 缓存

路线规划结果会缓存，避免重复计算。

### 3. 按需渲染

只有当前选中天的路线会被渲染，减少资源消耗。

## 扩展功能

### 1. 添加实时路况

```typescript
map.setTraffic(true);
```

### 2. 切换地图样式

```typescript
map.setMapStyle('amap://styles/dark'); // 暗色主题
map.setMapStyle('amap://styles/light'); // 亮色主题
```

### 3. 添加路线动画

```typescript
// 在路线上添加移动标记
const marker = new AMap.Marker({
  map: map,
  position: path[0],
  icon: 'https://webapi.amap.com/images/car.png',
  offset: new AMap.Pixel(-26, -13),
  autoRotation: true,
});

marker.moveAlong(path, 200);
```

## 相关文档

- [高德地图JS API文档](https://lbs.amap.com/api/javascript-api/summary)
- [路线规划API](https://lbs.amap.com/api/javascript-api/reference/route-search)
- [静态地图API](https://lbs.amap.com/api/webservice/guide/api/staticmaps)

## 技术支持

如遇问题，请查看：
1. 浏览器控制台错误信息
2. 后端日志
3. 高德开放平台控制台的API调用统计
