# 地图展示功能优化指南

## 优化概述

将地图展示功能优化为两层架构：
1. **静态地图**：小图预览，性能优化
2. **交互式地图**：全屏模态框，完整功能

## 技术方案

### 1. 静态地图（StaticRouteMap）

使用高德静态地图API生成图片：
- 快速加载，无需JS API
- 适合小图预览
- 显示路线和标记点
- 鼠标悬停显示"查看交互式地图"提示

**API调用**：
```
https://restapi.amap.com/v3/staticmap?
  key=YOUR_KEY
  &size=600*600
  &zoom=12
  &center=lng,lat
  &markers=mid,0x3B82F6,A:lng1,lat1|lng2,lat2
  &paths=5,0x3B82F6,0.8,,:lng1,lat1;lng2,lat2
  &scale=2
```

**优点**：
- 加载速度快（仅一张图片）
- 不占用JS资源
- 适合打印和导出

### 2. 交互式地图（InteractiveRouteMap）

使用高德JS API + 前端路径规划：
- 完整的地图交互（缩放、拖拽）
- 前端直接调用`AMap.Driving`服务规划路线
- 支持切换出行方式（驾车、步行、骑行）
- 实时显示距离和时间

**路径规划服务**：
```javascript
// 驾车
const driving = new AMap.Driving({
  map: map,
  policy: AMap.DrivingPolicy.LEAST_TIME
});

// 步行
const walking = new AMap.Walking({ map: map });

// 骑行
const riding = new AMap.Riding({ map: map });
```

**优点**：
- 无需后端API调用
- 实时性更好
- 可以切换出行方式
- 用户体验更好

## 使用方式

### 在Itinerary页面

```tsx
import StaticRouteMap from '../components/StaticRouteMap';
import InteractiveRouteMap from '../components/InteractiveRouteMap';

const [showInteractiveMap, setShowInteractiveMap] = useState(false);

// 构建途经点
const mapWaypoints = filteredPlans
  .filter(plan => plan.location)
  .map(plan => ({
    name: plan.name,
    location: plan.location!
  }));

// 渲染静态地图
<StaticRouteMap 
  waypoints={mapWaypoints} 
  onFullscreenClick={() => setShowInteractiveMap(true)}
/>

// 渲染交互式地图（模态框）
{showInteractiveMap && (
  <InteractiveRouteMap 
    waypoints={mapWaypoints}
    onClose={() => setShowInteractiveMap(false)}
  />
)}
```

## 组件API

### StaticRouteMap

**Props**：
- `waypoints`: 途经点数组
  ```ts
  Array<{
    name: string;
    location: { lat: number; lng: number };
  }>
  ```
- `onFullscreenClick`: 点击全屏按钮的回调

**特性**：
- 自动计算中心点
- 自动生成标记和路径
- 鼠标悬停显示提示
- 图片加载失败时显示占位符

### InteractiveRouteMap

**Props**：
- `waypoints`: 途经点数组（同上）
- `onClose`: 关闭模态框的回调

**特性**：
- 3D地图视角（pitch: 50）
- 自动适应所有标记点
- 支持三种出行方式切换
- 显示实时路线信息
- 全屏模态框展示

## 性能对比

| 指标 | 静态地图 | 交互式地图 |
|------|---------|-----------|
| 首次加载 | ~100ms | ~1-2s |
| 内存占用 | ~1MB | ~10-20MB |
| 网络请求 | 1次（图片） | 多次（JS库+瓦片） |
| 适用场景 | 预览、打印 | 详细查看、规划 |

## 路径规划方案对比

### 方案A：后端LBS服务（旧方案）

```
前端 → 后端API → 高德Web服务API → 返回路线数据 → 前端绘制
```

**缺点**：
- 需要后端接口
- 增加服务器负载
- 响应时间较长

### 方案B：前端JS API（新方案）✅

```
前端 → 高德JS API → 直接返回并绘制路线
```

**优点**：
- 无需后端接口
- 减少服务器负载
- 响应速度更快
- 代码更简洁

## 出行方式说明

### 驾车（Driving）
- 策略：最快路线（LEAST_TIME）
- 适用：自驾游、包车
- 显示：预计行车时间

### 步行（Walking）
- 适用：景点间步行
- 显示：步行距离和时间

### 骑行（Riding）
- 适用：共享单车、自行车
- 显示：骑行距离和时间

## 注意事项

1. **API Key配置**
   - 需要在`.env`文件中配置`VITE_AMAP_KEY`
   - 静态地图和JS API使用同一个Key

2. **位置信息要求**
   - 所有景点必须有`location`字段（lat, lng）
   - 至少需要2个景点才能规划路线

3. **打印友好**
   - 静态地图支持打印
   - 交互式地图不会出现在打印页面

4. **错误处理**
   - 静态地图加载失败显示占位符
   - 交互式地图加载失败显示错误提示

## 相关文件

- `voyager/src/components/StaticRouteMap.tsx` - 静态地图组件
- `voyager/src/components/InteractiveRouteMap.tsx` - 交互式地图组件
- `voyager/src/pages/Itinerary.tsx` - 行程页面（使用地图）
- `voyager/src/components/RouteMap.tsx` - 旧版地图组件（可删除）

## 未来优化方向

1. **缓存静态地图**
   - 将生成的静态地图URL缓存到localStorage
   - 避免重复生成

2. **路线优化**
   - 支持自定义途经点顺序
   - 智能推荐最优路线

3. **更多出行方式**
   - 公交换乘
   - 地铁路线

4. **离线地图**
   - 支持下载离线地图包
   - 无网络时也能查看

## 总结

通过静态地图+交互式地图的两层架构，实现了：
- ✅ 性能优化：小图快速加载
- ✅ 用户体验：全屏交互式查看
- ✅ 功能完整：支持多种出行方式
- ✅ 代码简化：前端直接规划路线
- ✅ 打印友好：静态地图支持打印
