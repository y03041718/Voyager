# 旅行计划保存功能实现文档

## 概述

实现了旅行计划的自动保存、查询、删除和分享功能。用户生成的旅行计划会自动保存到数据库，可以在"我的行程"页面查看和管理。

## 数据库设计

### 1. trip_plans 表（行程主表）

```sql
CREATE TABLE trip_plans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200),                    -- AI生成的行程标题
    destination VARCHAR(100),              -- 目的地城市
    start_date DATE,
    end_date DATE,
    travelers VARCHAR(50),
    style VARCHAR(50),
    plan_data JSON NOT NULL,               -- 完整行程数据（JSON格式）
    cover_image VARCHAR(500),              -- 封面图（第一张图片）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,        -- 软删除标记
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. trip_plan_shares 表（行程分享关联表）

```sql
CREATE TABLE trip_plan_shares (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trip_plan_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    shared_by BIGINT NOT NULL,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_plan_team (trip_plan_id, team_id),
    FOREIGN KEY (trip_plan_id) REFERENCES trip_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE
);
```

## 后端实现

### 1. 实体类

- `TripPlan.java` - 行程主表实体
- `TripPlanShare.java` - 分享关联表实体

### 2. Repository

- `TripPlanRepository.java` - 提供查询方法
  - `findByUserIdAndIsActiveTrueOrderByCreatedAtDesc()` - 查询用户的所有行程
  - `findByIdAndUserIdAndIsActiveTrue()` - 查询特定行程
  - `findVisibleTripPlans()` - 查询用户可见的所有行程（我的+团队分享的）

- `TripPlanShareRepository.java` - 分享关联查询
  - `existsByTripPlanIdAndTeamId()` - 检查是否已分享
  - `findByTripPlanId()` - 查询行程分享到的团队
  - `deleteByTripPlanIdAndTeamId()` - 删除分享记录

### 3. Service层

`TripPlanService.java` 提供以下功能：

- `generateTravelPlan()` - 生成旅行计划（自动保存到数据库）
- `saveTravelPlan()` - 保存行程到数据库
- `getMyTripPlans()` - 查询我的所有行程
- `getVisibleTripPlans()` - 查询可见的所有行程（我的+团队分享的）
- `getTripPlanDetail()` - 查询行程详情
- `updateTripPlan()` - 更新行程
- `deleteTripPlan()` - 删除行程（软删除）
- `shareTripPlan()` - 分享行程到团队
- `unshareTripPlan()` - 取消分享

### 4. Controller层

`TripPlanController.java` 提供REST API：

- `POST /api/trip-plans/generate` - 生成旅行计划（会自动保存）
- `GET /api/trip-plans/my` - 查询我的所有行程
- `GET /api/trip-plans/visible` - 查询可见的所有行程
- `GET /api/trip-plans/{id}` - 查询行程详情
- `DELETE /api/trip-plans/{id}` - 删除行程
- `POST /api/trip-plans/{id}/share` - 分享行程到团队
- `DELETE /api/trip-plans/{id}/share/{teamId}` - 取消分享

### 5. DTO类

- `TripPlanRequest.java` - 生成行程请求
- `TripPlanResponse.java` - 行程详情响应
- `TripPlanSummary.java` - 行程摘要（列表展示）
- `ShareTripPlanRequest.java` - 分享行程请求

## 前端实现

### 1. 类型定义（types.ts）

```typescript
// 行程摘要（列表展示）
interface TripPlanSummary {
  id: number;
  title?: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  style: string;
  coverImage?: string;
  createdAt: string;
  isOwner?: boolean;
}

// 从数据库读取的行程详情
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

### 2. API服务（api.ts）

```typescript
// 生成旅行计划（会自动保存）
async generateTripPlan(request: TripPlanRequest): Promise<TravelPlanResponse>

// 查询我的所有行程
async getMyTripPlans(): Promise<TripPlanSummary[]>

// 查询可见的所有行程（我的+团队分享的）
async getVisibleTripPlans(): Promise<TripPlanSummary[]>

// 查询行程详情
async getTripPlanDetail(id: number): Promise<any>

// 删除行程
async deleteTripPlan(id: number): Promise<void>

// 分享行程到团队
async shareTripPlan(id: number, teamId: number): Promise<void>

// 取消分享
async unshareTripPlan(id: number, teamId: number): Promise<void>
```

### 3. 我的行程页面（MyGuides.tsx）

功能：
- 展示用户的所有行程（我的+团队分享的）
- 筛选：全部、我的行程、团队共享
- 显示行程状态：即将开始、进行中、已完成
- 删除行程（仅自己创建的）
- 查看行程详情
- 创建新行程（跳转到探索页面）

## 核心功能流程

### 1. 生成并保存行程

```
用户在TripPlanner页面生成行程
  ↓
调用 POST /api/trip-plans/generate
  ↓
TripPlanService.generateTravelPlan()
  ↓
调用Qwen API生成行程
  ↓
自动调用 saveTravelPlan() 保存到数据库
  ↓
提取封面图（第一张图片）
  ↓
返回生成的行程给前端
```

### 2. 查看我的行程

```
用户访问"我的行程"页面
  ↓
调用 GET /api/trip-plans/visible
  ↓
TripPlanService.getVisibleTripPlans()
  ↓
查询用户创建的行程 + 团队分享给用户的行程
  ↓
返回行程列表（包含封面图、标题、日期等）
```

### 3. 分享行程到团队

```
用户点击"分享"按钮
  ↓
选择要分享的团队
  ↓
调用 POST /api/trip-plans/{id}/share
  ↓
TripPlanService.shareTripPlan()
  ↓
检查权限（是否是行程创建者、是否在团队中）
  ↓
创建分享记录到 trip_plan_shares 表
  ↓
团队成员可以在"我的行程"中看到此行程
```

## 数据存储方案

### JSON存储结构

完整的行程数据以JSON格式存储在`plan_data`字段中：

```json
{
  "title": "京都古韵文化之旅",
  "destination": "京都",
  "localTips": {
    "culture": "京都是日本的文化古都...",
    "food": "京都料理以精致著称...",
    "tips": "春秋季节最适合旅游..."
  },
  "days": [
    {
      "day": 1,
      "date": "2024-03-20",
      "weather": {
        "temperature": "18",
        "condition": "晴朗",
        "feelsLike": "20"
      },
      "plans": [
        {
          "time": "09:00",
          "type": "attraction",
          "id": "B000A7BD6C",
          "name": "清水寺",
          "desc": "京都最著名的寺庙之一",
          "duration": "2小时",
          "image": "http://store.is.autonavi.com/showpic/xxx",
          "rating": 4.8,
          "address": "京都市东山区清水1丁目294",
          "level": "5A景区",
          "location": {
            "lat": 34.9949,
            "lng": 135.7850
          }
        }
      ]
    }
  ]
}
```

### 封面图提取

从行程的第一张图片中提取封面图，存储在`cover_image`字段中，用于列表展示。

## 权限控制

1. **查看权限**：
   - 行程创建者可以查看
   - 行程分享到的团队成员可以查看

2. **修改权限**：
   - 仅行程创建者可以修改和删除

3. **分享权限**：
   - 仅行程创建者可以分享
   - 必须是团队成员才能分享到该团队

## 测试步骤

1. **生成并保存行程**：
   - 访问探索页面，选择目的地和景点
   - 点击"生成行程"
   - 检查数据库`trip_plans`表是否有新记录

2. **查看我的行程**：
   - 访问"我的行程"页面
   - 检查是否显示刚才生成的行程
   - 检查封面图、标题、日期等信息

3. **删除行程**：
   - 点击行程卡片右上角的删除按钮
   - 确认删除
   - 检查行程是否从列表中消失
   - 检查数据库`is_active`字段是否变为false

4. **分享行程**（待实现前端UI）：
   - 点击"分享"按钮
   - 选择团队
   - 检查`trip_plan_shares`表是否有新记录
   - 用团队成员账号登录，检查是否能看到分享的行程

## 后续优化

1. **前端**：
   - 实现行程详情页面（从数据库读取并展示）
   - 实现分享功能的UI
   - 实现行程编辑功能
   - 添加搜索和筛选功能

2. **后端**：
   - 添加行程更新接口的完整实现
   - 添加分页支持
   - 添加按目的地搜索功能
   - 优化查询性能（添加索引）

3. **功能增强**：
   - 行程导出为PDF
   - 行程复制功能
   - 行程模板功能
   - 行程评论和点赞

## 注意事项

1. **自动保存**：生成行程时会自动保存，无需用户手动点击保存按钮
2. **软删除**：删除行程使用软删除（`is_active=false`），数据不会真正删除
3. **JSON存储**：完整的行程数据以JSON格式存储，便于灵活扩展
4. **封面图**：自动提取第一张图片作为封面，无需用户选择
5. **权限检查**：所有操作都会检查用户权限，确保数据安全

## 相关文件

### 后端
- `database/trip_plan_tables.sql` - 数据库表创建脚本
- `src/main/java/com/example/voyagerdemo/entity/TripPlan.java`
- `src/main/java/com/example/voyagerdemo/entity/TripPlanShare.java`
- `src/main/java/com/example/voyagerdemo/repository/TripPlanRepository.java`
- `src/main/java/com/example/voyagerdemo/repository/TripPlanShareRepository.java`
- `src/main/java/com/example/voyagerdemo/service/TripPlanService.java`
- `src/main/java/com/example/voyagerdemo/controller/TripPlanController.java`
- `src/main/java/com/example/voyagerdemo/dto/TripPlanRequest.java`
- `src/main/java/com/example/voyagerdemo/dto/TripPlanResponse.java`
- `src/main/java/com/example/voyagerdemo/dto/TripPlanSummary.java`
- `src/main/java/com/example/voyagerdemo/dto/ShareTripPlanRequest.java`

### 前端
- `voyager/src/types.ts` - 类型定义
- `voyager/src/services/api.ts` - API服务
- `voyager/src/pages/MyGuides.tsx` - 我的行程页面
