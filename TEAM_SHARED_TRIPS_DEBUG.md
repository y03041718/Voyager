# 团队共享行程显示问题诊断

## 问题描述
在"我的行程"页面点击"团队共享"筛选时，无法显示团队分享的行程。

## 已确认信息
✅ 数据库中有分享记录（`trip_plan_shares`表）
✅ 后端查询逻辑正确（`findVisibleTripPlans`）
✅ 前端类型定义正确（`TripPlanSummary`）

## 诊断步骤

### 1. 检查后端SQL查询是否正确执行

在`TripPlanRepository.java`中添加日志：

```java
@Query("""
    SELECT DISTINCT tp FROM TripPlan tp
    LEFT JOIN TripPlanShare tps ON tp.id = tps.tripPlanId
    LEFT JOIN TeamMember tm ON tps.teamId = tm.team.id
    WHERE (tp.userId = :userId OR tm.user.id = :userId)
      AND tp.isActive = true
    ORDER BY tp.createdAt DESC
""")
List<TripPlan> findVisibleTripPlans(@Param("userId") Long userId);
```

**可能的问题**：
- `tm.team.id` 应该是 `tm.team.id` 还是 `tm.teamId`？
- JPA关联可能有问题

### 2. 验证SQL查询

手动执行SQL查询验证：

```sql
-- 假设当前用户ID为1
SELECT DISTINCT tp.id, tp.title, tp.destination, tp.user_id,
       CASE WHEN tp.user_id = 1 THEN TRUE ELSE FALSE END as is_owner
FROM trip_plans tp
LEFT JOIN trip_plan_shares tps ON tp.id = tps.trip_plan_id
LEFT JOIN team_members tm ON tps.team_id = tm.team_id
WHERE (tp.user_id = 1 OR tm.user_id = 1)
  AND tp.is_active = true
ORDER BY tp.created_at DESC;
```

**预期结果**：
- 应该返回用户自己的行程（is_owner=true）
- 应该返回团队分享的行程（is_owner=false）

### 3. 检查前端筛选逻辑

在`MyGuides.tsx`中添加调试日志：

```typescript
const loadTripPlans = async () => {
  try {
    setLoading(true);
    let plans: TripPlanSummary[];
    
    if (filter === 'my') {
      plans = await apiService.getMyTripPlans();
    } else if (filter === 'shared') {
      plans = await apiService.getVisibleTripPlans();
      console.log('🔍 所有可见行程:', plans);
      console.log('🔍 isOwner字段:', plans.map(p => ({ id: p.id, isOwner: p.isOwner })));
      plans = plans.filter(p => !p.isOwner);
      console.log('🔍 过滤后的共享行程:', plans);
    } else {
      plans = await apiService.getVisibleTripPlans();
    }
    
    setMyPlans(plans);
  } catch (error) {
    console.error('加载行程列表失败:', error);
  } finally {
    setLoading(false);
  }
};
```

### 4. 检查后端返回的数据

在`TripPlanService.java`中添加日志：

```java
public List<TripPlanSummary> getVisibleTripPlans() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    User user = userService.findByUsername(auth.getName());
    
    log.info("🔍 查询用户可见行程: userId={}", user.getId());

    List<TripPlan> plans = tripPlanRepository.findVisibleTripPlans(user.getId());
    
    log.info("🔍 查询到 {} 个行程", plans.size());

    return plans.stream().map(plan -> {
        TripPlanSummary summary = toSummary(plan);
        boolean isOwner = plan.getUserId().equals(user.getId());
        summary.setIsOwner(isOwner);
        log.info("🔍 行程: id={}, title={}, userId={}, currentUserId={}, isOwner={}", 
                 plan.getId(), plan.getTitle(), plan.getUserId(), user.getId(), isOwner);
        return summary;
    }).collect(Collectors.toList());
}
```

## 可能的问题和解决方案

### 问题1：JPA关联路径错误

**症状**：SQL查询没有正确关联`team_members`表

**原因**：`tm.team.id` 可能应该是 `tm.teamId`

**解决方案**：修改Repository查询

```java
@Query("""
    SELECT DISTINCT tp FROM TripPlan tp
    LEFT JOIN TripPlanShare tps ON tp.id = tps.tripPlanId
    LEFT JOIN TeamMember tm ON tps.teamId = tm.teamId AND tm.userId = :userId
    WHERE (tp.userId = :userId OR tm.userId IS NOT NULL)
      AND tp.isActive = true
    ORDER BY tp.createdAt DESC
""")
List<TripPlan> findVisibleTripPlans(@Param("userId") Long userId);
```

### 问题2：TeamMember实体字段名不匹配

**检查**：`TeamMember`实体中的字段名

```java
@Entity
@Table(name = "team_members")
public class TeamMember {
    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;  // ← 这里是team对象
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;  // ← 这里是user对象
}
```

**正确的JPQL路径**：
- `tm.team.id` ✅（访问Team对象的id）
- `tm.user.id` ✅（访问User对象的id）

### 问题3：前端isOwner字段为undefined

**症状**：`p.isOwner`为`undefined`，导致`!p.isOwner`为`true`

**解决方案**：修改前端筛选逻辑

```typescript
} else if (filter === 'shared') {
  plans = await apiService.getVisibleTripPlans();
  plans = plans.filter(p => p.isOwner === false);  // 明确检查false
}
```

## 推荐的修复方案

### 方案1：使用原生SQL查询（最可靠）

```java
@Query(value = """
    SELECT DISTINCT tp.id, tp.user_id, tp.title, tp.destination, 
           tp.start_date, tp.end_date, tp.travelers, tp.style, 
           tp.cover_image, tp.created_at,
           CASE WHEN tp.user_id = :userId THEN 1 ELSE 0 END as is_owner
    FROM trip_plans tp
    LEFT JOIN trip_plan_shares tps ON tp.id = tps.trip_plan_id
    LEFT JOIN team_members tm ON tps.team_id = tm.team_id AND tm.user_id = :userId
    WHERE (tp.user_id = :userId OR tm.user_id IS NOT NULL)
      AND tp.is_active = true
    ORDER BY tp.created_at DESC
    """, nativeQuery = true)
List<Object[]> findVisibleTripPlansNative(@Param("userId") Long userId);
```

然后在Service中手动映射：

```java
public List<TripPlanSummary> getVisibleTripPlans() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    User user = userService.findByUsername(auth.getName());

    List<Object[]> results = tripPlanRepository.findVisibleTripPlansNative(user.getId());
    
    return results.stream().map(row -> {
        TripPlanSummary summary = new TripPlanSummary();
        summary.setId(((Number) row[0]).longValue());
        summary.setTitle((String) row[2]);
        summary.setDestination((String) row[3]);
        summary.setStartDate((LocalDate) row[4]);
        summary.setEndDate((LocalDate) row[5]);
        summary.setTravelers((String) row[6]);
        summary.setStyle((String) row[7]);
        summary.setCoverImage((String) row[8]);
        summary.setCreatedAt(((Timestamp) row[9]).toLocalDateTime());
        summary.setIsOwner(((Number) row[10]).intValue() == 1);
        return summary;
    }).collect(Collectors.toList());
}
```

### 方案2：修复JPQL查询（推荐）

```java
@Query("""
    SELECT DISTINCT tp FROM TripPlan tp
    LEFT JOIN TripPlanShare tps ON tp.id = tps.tripPlanId
    LEFT JOIN TeamMember tm ON tps.teamId = tm.team.id AND tm.user.id = :userId
    WHERE (tp.userId = :userId OR tm IS NOT NULL)
      AND tp.isActive = true
    ORDER BY tp.createdAt DESC
""")
List<TripPlan> findVisibleTripPlans(@Param("userId") Long userId);
```

关键改动：
- `tm.user.id = :userId` 添加到JOIN条件中
- `WHERE`条件改为`tm IS NOT NULL`

## 测试步骤

1. 启动后端，查看日志输出
2. 登录前端，进入"我的行程"页面
3. 点击"团队共享"筛选
4. 查看浏览器控制台日志
5. 查看后端日志输出

## 预期结果

- 后端日志应该显示查询到的行程数量和isOwner字段
- 前端控制台应该显示过滤前后的行程列表
- "团队共享"筛选应该只显示`isOwner=false`的行程
