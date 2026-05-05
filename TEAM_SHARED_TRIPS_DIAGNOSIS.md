# 团队共享行程诊断指南

## 问题描述
团队共享分类里没有显示共享行程

## 诊断步骤

### 1. 检查数据库中的分享记录

```sql
-- 查看所有分享记录
SELECT * FROM trip_plan_shares;

-- 查看特定行程的分享记录
SELECT tps.*, t.name as team_name, tp.title as trip_title
FROM trip_plan_shares tps
LEFT JOIN teams t ON tps.team_id = t.id
LEFT JOIN trip_plans tp ON tps.trip_plan_id = tp.id;

-- 查看用户可见的行程（包括自己的和团队分享的）
SELECT DISTINCT tp.id, tp.title, tp.user_id, tp.destination
FROM trip_plans tp
LEFT JOIN trip_plan_shares tps ON tp.id = tps.trip_plan_id
LEFT JOIN team_members tm ON tps.team_id = tm.team_id
WHERE (tp.user_id = 1 OR tm.user_id = 1)  -- 替换为实际用户ID
  AND tp.is_active = 1
ORDER BY tp.created_at DESC;
```

### 2. 检查后端日志

启动后端应用，访问"我的行程"页面，点击"团队共享"筛选，查看控制台日志：

**期望看到的日志：**
```
🔍 查询用户可见行程: userId=1, username=xxx
🔍 查询到 X 个可见行程
🔍 行程 X 的分享记录数: Y
🔍 找到团队: teamId=X, teamName=XXX
🔍 团队信息: teamId=X, teamName=XXX, sharedAt=XXX
🔍 设置了 Y 个共享团队
🔍 行程详情: id=X, title=XXX, userId=X, currentUserId=X, isOwner=true/false, sharedTeams=Y
```

### 3. 检查前端日志

打开浏览器开发者工具（F12），查看Console：

**期望看到的日志：**
```
🔍 所有可见行程: Array(X)
🔍 详细信息: Array(X)
  - 每个行程应该有 sharedTeams 字段
🔍 过滤后的共享行程: Array(Y)
```

### 4. 常见问题排查

#### 问题1：数据库中没有分享记录
**解决方案：** 先分享一个行程到团队
1. 进入"我的行程"页面
2. 点击某个行程的"分享"按钮
3. 选择一个团队进行分享

#### 问题2：后端没有查询到分享记录
**可能原因：**
- `TripPlanShareRepository.findByTripPlanId()` 方法有问题
- 数据库连接有问题

**检查方法：**
```java
// 在 TripPlanService.getVisibleTripPlans() 中添加日志
List<TripPlanShare> shares = tripPlanShareRepository.findByTripPlanId(plan.getId());
log.info("🔍 行程 {} 的分享记录数: {}", plan.getId(), shares.size());
```

#### 问题3：团队名称查询失败
**可能原因：**
- `TeamRepository.findById()` 返回空
- 团队被软删除（is_active=false）

**检查方法：**
```sql
-- 检查团队是否存在且有效
SELECT * FROM teams WHERE id = X AND is_active = 1;
```

#### 问题4：前端过滤逻辑有问题
**可能原因：**
- `sharedTeams` 字段为 `null` 或 `undefined`
- 过滤条件写错了

**检查方法：**
```typescript
// 在 MyGuides.tsx 中添加日志
console.log('🔍 过滤前:', plans);
console.log('🔍 每个行程的 sharedTeams:', plans.map(p => ({
  id: p.id,
  sharedTeams: p.sharedTeams
})));
plans = plans.filter(p => p.sharedTeams && p.sharedTeams.length > 0);
console.log('🔍 过滤后:', plans);
```

### 5. 完整的测试流程

1. **准备测试数据**
   ```sql
   -- 确保有团队
   SELECT * FROM teams WHERE is_active = 1;
   
   -- 确保有行程
   SELECT * FROM trip_plans WHERE is_active = 1;
   
   -- 确保用户在团队中
   SELECT * FROM team_members WHERE user_id = 1;
   ```

2. **分享行程**
   - 使用 Postman 或前端界面分享一个行程到团队
   - API: `POST /api/trip-plans/{id}/share`
   - Body: `{"teamId": 1}`

3. **验证分享记录**
   ```sql
   SELECT * FROM trip_plan_shares ORDER BY shared_at DESC LIMIT 5;
   ```

4. **测试查询**
   - 访问"我的行程"页面
   - 点击"团队共享"筛选
   - 查看是否显示已分享的行程

### 6. 预期结果

**数据库：**
- `trip_plan_shares` 表中有记录
- 记录的 `team_id` 对应的团队存在且 `is_active=1`
- 记录的 `trip_plan_id` 对应的行程存在且 `is_active=1`

**后端日志：**
- 查询到分享记录
- 成功查询到团队名称
- 成功设置 `sharedTeams` 字段

**前端日志：**
- 接收到的行程数据包含 `sharedTeams` 字段
- 过滤后有行程显示

**界面：**
- "团队共享"分类下显示已分享的行程
- 行程卡片上显示"共享团队"标签
- 行程详情中显示共享到的团队列表

## 当前修改

### 后端修改
1. ✅ 在 `TripPlanSummary.java` 中添加了 `sharedTeams` 字段和 `SharedTeamInfo` 内部类
2. ✅ 在 `TripPlanService.java` 中添加了 `TeamRepository` 依赖
3. ✅ 在 `getVisibleTripPlans()` 方法中查询并填充 `sharedTeams` 字段
4. ✅ 添加了详细的日志输出

### 前端修改
1. ✅ 在 `types.ts` 中已有 `sharedTeams` 和 `SharedTeamInfo` 类型定义
2. ✅ 在 `MyGuides.tsx` 中恢复了过滤逻辑：`plans.filter(p => p.sharedTeams && p.sharedTeams.length > 0)`
3. ✅ 在行程卡片中添加了显示共享团队的UI

## 下一步

1. 重启后端应用
2. 刷新前端页面
3. 查看后端和前端日志
4. 如果还是没有数据，检查数据库中是否真的有分享记录
