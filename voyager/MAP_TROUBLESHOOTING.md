# 地图功能故障排查指南

## 问题1：静态地图显示"地图加载失败"

### 可能原因

1. **API Key未开通静态地图服务**
   - 高德地图的静态地图API需要单独申请
   - 不是所有Key都默认开通此服务

2. **API Key配置错误**
   - 检查`.env`文件中的`VITE_AMAP_KEY`是否正确
   - 确认Key类型为"Web端(JS API)"

3. **参数格式错误**
   - 静态地图API对参数格式要求严格

### 排查步骤

#### 步骤1：检查浏览器控制台

打开浏览器控制台（F12），查看：
```
静态地图URL: https://restapi.amap.com/v3/staticmap?...
```

复制这个URL，在浏览器新标签页中打开，查看返回内容：
- 如果返回图片：说明API正常
- 如果返回JSON错误：查看错误信息

#### 步骤2：常见错误信息

**错误1：INVALID_USER_KEY**
```json
{
  "status": "0",
  "info": "INVALID_USER_KEY",
  "infocode": "10001"
}
```
解决：检查API Key是否正确

**错误2：DAILY_QUERY_OVER_LIMIT**
```json
{
  "status": "0",
  "info": "DAILY_QUERY_OVER_LIMIT",
  "infocode": "10003"
}
```
解决：今日配额已用完，明天再试或升级配额

**错误3：SERVICE_NOT_AVAILABLE**
```json
{
  "status": "0",
  "info": "SERVICE_NOT_AVAILABLE",
  "infocode": "10004"
}
```
解决：该Key未开通静态地图服务

#### 步骤3：验证API Key

访问高德开放平台：https://console.amap.com/dev/key/app
1. 找到你的Key
2. 查看"服务"列是否包含"静态地图"
3. 如果没有，需要重新申请或开通

### 临时解决方案

如果静态地图无法使用，可以直接点击"查看交互式地图"按钮，使用JS API地图。

---

## 问题2：交互式地图显示"路线规划失败"

### 可能原因

1. **途经点数据问题**
   - 途经点没有location字段
   - 坐标格式错误（经纬度顺序）

2. **路径规划服务未加载**
   - AMap.Driving等插件未正确加载

3. **API调用限制**
   - 超过每日配额
   - 请求频率过高

4. **坐标超出服务范围**
   - 高德地图主要服务中国大陆
   - 海外坐标可能无法规划路线

### 排查步骤

#### 步骤1：检查浏览器控制台日志

查找以下关键日志：

```
高德地图API已加载
可用服务: {Driving: true, Walking: true, Riding: true}
开始初始化地图，途经点: [...]
地图初始化完成
开始规划路线，出行方式: driving 途经点数量: 3
途经点坐标: [[lng1, lat1], [lng2, lat2], ...]
```

#### 步骤2：检查途经点数据

在控制台查看：
```
途经点坐标: [[118.xxx, 24.xxx], [118.xxx, 24.xxx]]
```

确认：
- 经度（lng）在 73-135 之间（中国范围）
- 纬度（lat）在 3-53 之间（中国范围）
- 坐标顺序是 [经度, 纬度]

#### 步骤3：查看错误信息

如果看到：
```
路线规划失败 - 状态: error 错误信息: {...}
```

常见错误：

**错误1：NO_DATA**
- 原因：两点之间无法规划路线（距离太远、跨海等）
- 解决：检查坐标是否正确，尝试减少途经点

**错误2：OVER_DIRECTION_RANGE**
- 原因：途经点距离超过限制（驾车最多16个途经点）
- 解决：减少途经点数量

**错误3：ENGINE_RESPONSE_DATA_ERROR**
- 原因：服务器返回数据异常
- 解决：稍后重试

#### 步骤4：验证API Key权限

1. 访问：https://console.amap.com/dev/key/app
2. 检查Key的"服务"列是否包含：
   - Web服务API
   - 路径规划
   - 驾车路径规划
   - 步行路径规划

### 临时解决方案

如果路径规划失败，地图仍会显示所有标记点，你可以：
1. 手动查看各景点位置
2. 使用地图的缩放和拖拽功能
3. 切换不同的出行方式尝试

---

## 问题3：后端location字段仍然为空

### 排查步骤

#### 步骤1：确认后端已重启

```bash
# 停止后端（Ctrl+C）
# 重新启动
mvn spring-boot:run
```

#### 步骤2：查看后端日志

生成新行程时，应该看到：
```
📍 开始填充POI数据，POI映射表大小: 5
处理计划: name=鼓浪屿风景名胜区, id=B025003YN2
✅ 已设置位置信息: 鼓浪屿风景名胜区 (lat=24.xxxxx, lng=118.xxxxx)
📍 位置信息统计: 8/10 个计划有位置信息
```

如果没有看到这些日志：
1. 确认`TripPlanService.java`文件已更新
2. 确认Maven已重新编译

#### 步骤3：生成新行程

**重要**：旧行程的数据结构中没有location字段，必须生成新行程！

1. 在"探索"页面搜索POI
2. 选择至少2个景点
3. 点击"生成行程"
4. 查看新生成的行程

#### 步骤4：检查前端日志

在浏览器控制台查看：
```
=== 路线地图调试信息 ===
第一个计划是否有location字段: {lat: 24.xxx, lng: 118.xxx}
位置信息数量: 8
```

如果仍然是`undefined`：
1. 清除浏览器缓存
2. 刷新页面
3. 重新生成行程

---

## 完整诊断清单

### 前端检查

- [ ] `.env`文件中有`VITE_AMAP_KEY`配置
- [ ] 浏览器控制台无JS错误
- [ ] 能看到"高德地图API已加载"日志
- [ ] 能看到途经点坐标日志
- [ ] 坐标格式正确（经度在前，纬度在后）

### 后端检查

- [ ] `TripPlanService.java`已更新
- [ ] 后端已重启
- [ ] 能看到"📍 开始填充POI数据"日志
- [ ] 能看到"✅ 已设置位置信息"日志
- [ ] 生成的是新行程（不是查看旧行程）

### API Key检查

- [ ] Key类型为"Web端(JS API)"
- [ ] 已开通"Web服务API"
- [ ] 已开通"路径规划"服务
- [ ] 未超过每日配额

---

## 快速测试

### 测试静态地图API

在浏览器中访问（替换YOUR_KEY）：
```
https://restapi.amap.com/v3/staticmap?location=116.481485,39.990464&zoom=10&size=600*600&markers=mid,0xFF0000,A:116.481485,39.990464&key=YOUR_KEY
```

应该返回一张北京地图的图片。

### 测试JS API

在浏览器控制台执行：
```javascript
const script = document.createElement('script');
script.src = 'https://webapi.amap.com/maps?v=2.0&key=YOUR_KEY';
script.onload = () => console.log('API加载成功', !!window.AMap);
document.head.appendChild(script);
```

应该看到：`API加载成功 true`

---

## 联系支持

如果以上步骤都无法解决问题，请提供：
1. 浏览器控制台的完整日志
2. 后端日志（关于POI数据填充的部分）
3. API Key的服务列表截图
4. 具体的错误信息

这样我可以更准确地帮你诊断问题。
