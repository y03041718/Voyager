# 查看保存的行程功能指南

## 功能概述

用户可以在"我的行程"页面查看所有保存的旅行计划，点击行程卡片即可查看详细的行程安排。

## 实现细节

### 1. 路由配置

在`App.tsx`中已配置两个路由：
- `/itinerary` - 查看新生成的行程（从context获取）
- `/itinerary/:id` - 查看保存的行程（从数据库加载）

### 2. 我的行程页面（MyGuides.tsx）

**功能**：
- 展示用户的所有行程列表
- 支持筛选：全部、我的行程、团队共享
- 显示行程状态：即将开始、进行中、已完成
- 点击"查看详细行程"按钮导航到详情页

**关键代码**：
```typescript
const handleViewPlan = (id: number) => {
  // 导航到行程详情页面，传递行程ID
  navigate(`/itinerary/${id}`);
};
```

### 3. 行程详情页面（Itinerary.tsx）

**功能**：
- 支持两种模式：
  1. 新生成的行程（从SelectionContext获取）
  2. 保存的行程（从API加载）
- 自动检测URL参数，如果有`id`则从数据库加载
- 显示加载状态和错误处理

**关键代码**：
```typescript
// 检测URL参数
const { id } = useParams<{ id: string }>();

// 如果有ID，从API加载
useEffect(() => {
  if (id) {
    loadPlanFromApi(parseInt(id));
  }
}, [id]);

// 加载函数
const loadPlanFromApi = async (planId: number) => {
  try {
    setLoading(true);
    const response = await apiService.getTripPlanDetail(planId);
    
    // 解析JSON字符串
    const planData: TravelPlanResponse = JSON.parse(response.planData);
    
    setLoadedPlan(planData);
    setGeneratedPlan(planData);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// 使用加载的计划或context中的计划
const currentPlan = loadedPlan || generatedPlan;
```

### 4. API服务（api.ts）

**方法**：`getTripPlanDetail(id: number)`

**返回类型**：`SavedTripPlanResponse`
```typescript
interface SavedTripPlanResponse {
  id: number;
  userId: number;
  title?: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  style: string;
  planData: string;  // JSON字符串，需要解析为TravelPlanResponse
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
}
```

**注意**：`planData`字段是JSON字符串，包含完整的行程数据，需要使用`JSON.parse()`解析。

### 5. 后端API

**接口**：`GET /api/trip-plans/{id}`

**权限检查**：
- 行程创建者可以访问
- 行程分享到的团队成员可以访问

**返回数据**：
```json
{
  "id": 1,
  "userId": 1,
  "title": "京都古韵文化之旅",
  "destination": "京都",
  "startDate": "2024-03-20",
  "endDate": "2024-03-23",
  "travelers": "2人",
  "style": "文化体验",
  "planData": "{\"title\":\"京都古韵文化之旅\",\"destination\":\"京都\",\"days\":[...]}",
  "coverImage": "http://localhost:8080/api/pics/xxx.jpg",
  "createdAt": "2024-03-15T10:30:00",
  "updatedAt": "2024-03-15T10:30:00",
  "isOwner": true
}
```

## 用户流程

1. **访问我的行程页面**
   - 用户点击导航栏的"我的行程"
   - 系统调用`GET /api/trip-plans/visible`获取行程列表
   - 显示所有行程卡片（我的+团队分享的）

2. **查看行程详情**
   - 用户点击行程卡片的"查看详细行程"按钮
   - 导航到`/itinerary/{id}`
   - 系统调用`GET /api/trip-plans/{id}`获取行程详情
   - 解析`planData`JSON字符串
   - 显示完整的行程安排

3. **查看行程内容**
   - 天数选择器：切换不同天的行程
   - 景点列表：显示每天的景点、餐厅安排
   - 路线地图：显示当天的路线规划
   - 天气信息：显示当天的天气预报
   - 当地提示：显示文化、美食、旅行建议

4. **其他操作**
   - 打印行程：使用浏览器打印功能
   - 分享到团队：将行程分享给团队成员
   - 返回列表：点击返回按钮回到我的行程页面

## 状态处理

### 加载状态
```tsx
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin ..."></div>
      <p>加载行程中...</p>
    </div>
  );
}
```

### 错误状态
```tsx
if (error) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h2>加载失败</h2>
      <p>{error}</p>
      <button onClick={() => navigate('/my-guides')}>
        返回我的行程
      </button>
    </div>
  );
}
```

### 空状态
```tsx
if (!currentPlan) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h2>暂无行程</h2>
      <p>您还没有生成旅行计划</p>
      <button onClick={() => navigate('/')}>
        返回探索
      </button>
    </div>
  );
}
```

## 测试步骤

1. **生成并保存行程**
   - 访问探索页面
   - 选择目的地和景点
   - 点击"生成行程"
   - 系统自动保存到数据库

2. **查看行程列表**
   - 访问"我的行程"页面
   - 检查是否显示刚才生成的行程
   - 检查封面图、标题、日期等信息

3. **查看行程详情**
   - 点击行程卡片的"查看详细行程"按钮
   - 检查是否正确加载行程数据
   - 检查天数选择器是否正常工作
   - 检查景点列表是否完整显示
   - 检查路线地图是否正确显示

4. **测试权限**
   - 用另一个账号登录
   - 尝试访问其他用户的行程（应该失败）
   - 加入团队后，查看团队分享的行程（应该成功）

## 注意事项

1. **数据格式**：后端返回的`planData`是JSON字符串，前端必须使用`JSON.parse()`解析

2. **权限控制**：后端会检查用户权限，只有创建者和团队成员可以访问

3. **错误处理**：前端需要处理加载失败的情况，显示友好的错误提示

4. **性能优化**：行程数据可能较大，建议使用懒加载或分页

5. **缓存策略**：可以考虑在前端缓存已加载的行程，避免重复请求

## 相关文件

### 前端
- `voyager/src/pages/MyGuides.tsx` - 我的行程列表页面
- `voyager/src/pages/Itinerary.tsx` - 行程详情页面
- `voyager/src/services/api.ts` - API服务
- `voyager/src/types.ts` - 类型定义
- `voyager/src/App.tsx` - 路由配置

### 后端
- `src/main/java/com/example/voyagerdemo/controller/TripPlanController.java` - 控制器
- `src/main/java/com/example/voyagerdemo/service/TripPlanService.java` - 服务层
- `src/main/java/com/example/voyagerdemo/repository/TripPlanRepository.java` - 数据访问层
- `src/main/java/com/example/voyagerdemo/dto/TripPlanResponse.java` - 响应DTO

## 后续优化

1. **添加编辑功能**：允许用户修改保存的行程
2. **添加复制功能**：复制行程创建新的计划
3. **添加导出功能**：导出为PDF或图片
4. **添加评论功能**：团队成员可以评论行程
5. **添加收藏功能**：收藏喜欢的行程
6. **添加搜索功能**：按目的地、日期搜索行程
7. **添加分页功能**：行程列表支持分页加载
