# 行程分享到团队功能指南

## 功能概述

用户可以将保存的旅行计划分享到团队，团队成员可以查看分享的行程。

## 实现细节

### 1. 前端实现（Itinerary.tsx）

**新增状态**：
```typescript
const [currentTripId, setCurrentTripId] = useState<number | null>(null);
const [shareError, setShareError] = useState<string | null>(null);
const [myTeams, setMyTeams] = useState<any[]>([]);
const [loadingTeams, setLoadingTeams] = useState(false);
```

**关键功能**：

1. **加载行程时保存ID**：
```typescript
const loadPlanFromApi = async (planId: number) => {
  // ... 加载逻辑
  setCurrentTripId(planId); // 保存行程ID
};
```

2. **加载团队列表**：
```typescript
const loadTeams = async () => {
  try {
    setLoadingTeams(true);
    const teams = await apiService.getTeams();
    setMyTeams(teams);
  } catch (err) {
    console.error('加载团队列表失败:', err);
  } finally {
    setLoadingTeams(false);
  }
};
```

3. **打开分享模态框**：
```typescript
const handleOpenShareModal = () => {
  setShowShareModal(true);
  loadTeams(); // 打开时加载团队列表
};
```

4. **分享行程**：
```typescript
const handleShare = async (teamId: number) => {
  if (!currentTripId) {
    setShareError('无法分享：行程未保存');
    return;
  }

  try {
    await apiService.shareTripPlan(currentTripId, teamId);
    setSharedTeamId(teamId);
    // 1.5秒后关闭模态框
    setTimeout(() => {
      setShowShareModal(false);
      setSharedTeamId(null);
    }, 1500);
  } catch (err) {
    setShareError(err.message);
  }
};
```

**UI特性**：
- 分享按钮只在有行程ID时显示（即只有保存的行程才能分享）
- 分享按钮位于打印按钮旁边
- 点击分享按钮打开模态框并加载团队列表
- 显示加载状态、空状态和错误状态
- 分享成功后显示绿色勾选标记

### 2. 后端API

**接口**：`POST /api/trip-plans/{id}/share`

**请求体**：
```json
{
  "teamId": 1
}
```

**权限检查**：
- 只有行程创建者可以分享
- 用户必须是团队成员

**业务逻辑**：
1. 检查行程是否存在且属于当前用户
2. 检查用户是否在团队中
3. 检查是否已分享（避免重复分享）
4. 创建分享记录到`trip_plan_shares`表

**返回**：
```json
{
  "message": "行程已分享到团队"
}
```

### 3. 数据库

**trip_plan_shares表**：
```sql
CREATE TABLE trip_plan_shares (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trip_plan_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    shared_by BIGINT NOT NULL,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_plan_team (trip_plan_id, team_id)
);
```

**唯一约束**：同一个行程不能重复分享给同一个团队

## 用户流程

1. **查看保存的行程**
   - 用户在"我的行程"页面点击行程
   - 导航到行程详情页（`/itinerary/{id}`）
   - 系统加载行程数据并保存行程ID

2. **打开分享模态框**
   - 用户点击打印按钮旁边的分享按钮
   - 系统打开分享模态框
   - 自动加载用户的团队列表

3. **选择团队分享**
   - 用户从列表中选择要分享的团队
   - 点击团队卡片
   - 系统调用API分享行程

4. **分享成功**
   - 显示绿色勾选标记
   - 1.5秒后自动关闭模态框
   - 团队成员可以在"我的行程"中看到分享的行程

5. **查看分享的行程**
   - 团队成员访问"我的行程"页面
   - 筛选"团队共享"
   - 看到分享的行程（标记为"团队共享"）
   - 点击查看详情

## UI状态

### 1. 分享按钮
```tsx
{currentTripId && (
  <button 
    onClick={handleOpenShareModal}
    className="w-14 h-14 bg-white rounded-2xl..."
    title="分享到团队"
  >
    <Share2 className="w-6 h-6" />
  </button>
)}
```

### 2. 加载状态
```tsx
{loadingTeams ? (
  <div className="text-center py-8">
    <div className="animate-spin..."></div>
    <p>加载团队中...</p>
  </div>
) : ...}
```

### 3. 空状态
```tsx
{myTeams.length === 0 ? (
  <div className="text-center py-8">
    <Users2 className="w-10 h-10..." />
    <p>暂无团队</p>
    <button onClick={() => navigate('/profile')}>
      去创建团队
    </button>
  </div>
) : ...}
```

### 4. 错误状态
```tsx
{shareError && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
    <p className="text-red-600">{shareError}</p>
  </div>
)}
```

### 5. 成功状态
```tsx
{sharedTeamId === team.id ? (
  <Check className="w-5 h-5 text-green-500" />
) : (
  <ChevronRight className="w-5 h-5..." />
)}
```

## 测试步骤

1. **准备工作**
   - 创建至少一个团队
   - 生成并保存一个行程

2. **测试分享功能**
   - 访问"我的行程"页面
   - 点击行程查看详情
   - 检查是否显示分享按钮
   - 点击分享按钮
   - 检查是否显示团队列表
   - 选择一个团队分享
   - 检查是否显示成功标记

3. **测试权限**
   - 用团队成员账号登录
   - 访问"我的行程"页面
   - 筛选"团队共享"
   - 检查是否显示分享的行程
   - 点击查看详情
   - 检查是否能正常查看

4. **测试错误处理**
   - 尝试分享未保存的行程（应该不显示分享按钮）
   - 尝试重复分享到同一个团队（应该显示错误）
   - 尝试分享到不存在的团队（应该显示错误）

## 注意事项

1. **只有保存的行程才能分享**：新生成但未保存的行程不显示分享按钮

2. **权限控制**：
   - 只有行程创建者可以分享
   - 用户必须是团队成员才能分享到该团队

3. **避免重复分享**：数据库有唯一约束，同一行程不能重复分享给同一团队

4. **实时加载**：打开分享模态框时实时加载团队列表，确保数据最新

5. **错误处理**：所有API调用都有错误处理，显示友好的错误提示

## 相关文件

### 前端
- `voyager/src/pages/Itinerary.tsx` - 行程详情页面（包含分享功能）
- `voyager/src/services/api.ts` - API服务（shareTripPlan方法）
- `voyager/src/types.ts` - 类型定义

### 后端
- `src/main/java/com/example/voyagerdemo/controller/TripPlanController.java` - 控制器
- `src/main/java/com/example/voyagerdemo/service/TripPlanService.java` - 服务层
- `src/main/java/com/example/voyagerdemo/repository/TripPlanShareRepository.java` - 数据访问层
- `src/main/java/com/example/voyagerdemo/dto/ShareTripPlanRequest.java` - 请求DTO

### 数据库
- `database/trip_plan_tables.sql` - 数据库表创建脚本

## 后续优化

1. **批量分享**：支持一次分享到多个团队
2. **取消分享**：支持取消已分享的行程
3. **分享通知**：团队成员收到分享通知
4. **分享权限**：支持设置查看权限（只读/可编辑）
5. **分享统计**：显示分享次数和查看次数
6. **分享链接**：生成分享链接，非团队成员也可查看
7. **分享历史**：查看行程的分享历史记录
