# 路线地图功能 - 快速开始

## 🎯 功能说明

在行程页面展示交互式路线地图，自动规划景点间的最优路线，显示距离和时间。

## 📋 前置要求

1. 高德地图API账号
2. 两个API Key：
   - Web服务API Key（后端用）
   - Web端JS API Key（前端用）

## 🚀 快速配置（5分钟）

### 步骤1：申请高德地图API Key

访问：https://console.amap.com/dev/key/app

1. 创建应用
2. 添加两个Key：
   - **Key 1**：服务平台选择"Web服务"（后端用）
   - **Key 2**：服务平台选择"Web端(JS API)"（前端用）

### 步骤2：配置后端

编辑 `src/main/resources/application.yml`：

```yaml
amap:
  key: 你的Web服务API_Key
  base-url: https://restapi.amap.com/v3
```

### 步骤3：配置前端

在 `voyager` 目录下创建 `.env` 文件：

```env
VITE_AMAP_KEY=你的Web端JS_API_Key
```

### 步骤4：重启服务

```bash
# 后端
mvn spring-boot:run

# 前端
cd voyager
npm run dev
```

## ✅ 验证功能

1. 访问行程页面（Itinerary）
2. 查看右侧"路线地图"卡片
3. 应该能看到：
   - 交互式地图
   - 景点标记（带序号）
   - 路线轨迹（蓝色线条）
   - 距离和时间信息

## 🎨 效果展示

### 地图功能
- ✅ 自动标记所有景点
- ✅ 规划最优路线
- ✅ 显示总距离（km）
- ✅ 显示预计时间（分钟）
- ✅ 支持缩放、拖拽
- ✅ 支持全屏查看

### 打印支持
- ✅ 打印时保留地图
- ✅ 自动隐藏交互按钮
- ✅ 保留距离和时间信息

## 🔧 API接口

### 后端新增接口

```
GET  /api/amap/directions          # 两点路线规划
POST /api/amap/directions/multi    # 多点路线规划
POST /api/amap/static-map          # 生成静态地图URL
```

### 前端新增组件

```tsx
<RouteMap 
  waypoints={[
    { name: '景点1', location: { lat: 35.0, lng: 135.7 } },
    { name: '景点2', location: { lat: 35.1, lng: 135.8 } }
  ]}
  onRouteCalculated={(distance, duration) => {
    console.log(`${distance}km, ${duration}分钟`);
  }}
/>
```

## 📝 注意事项

1. **Key类型**：前后端必须使用对应类型的Key
2. **坐标格式**：高德使用"经度,纬度"格式（注意顺序）
3. **最少点数**：至少需要2个有效位置才能规划路线
4. **配额限制**：免费版每天有调用次数限制

## 🐛 常见问题

### 地图不显示？
- 检查 `.env` 文件中的 `VITE_AMAP_KEY`
- 确认Key类型为"Web端(JS API)"
- 查看浏览器控制台错误

### 路线规划失败？
- 检查后端 `application.yml` 中的Key
- 确认至少有2个景点有位置信息
- 查看后端日志

### 距离时间不显示？
- 等待路线规划完成（通常1-2秒）
- 检查浏览器控制台是否有错误
- 确认景点有有效的经纬度坐标

## 📚 详细文档

查看完整文档：`voyager/ROUTE_MAP_GUIDE.md`

## 🎉 完成！

现在你的行程页面已经有了完整的路线地图功能！
