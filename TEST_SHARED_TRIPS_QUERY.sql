-- 测试团队共享行程查询
-- 请将 ? 替换为实际的用户ID

-- ========================================
-- 1. 检查用户信息
-- ========================================
SELECT id, username FROM users WHERE id = ?;  -- 替换为当前登录用户ID

-- ========================================
-- 2. 检查用户所在的团队
-- ========================================
SELECT tm.id, tm.team_id, tm.user_id, tm.role, t.name as team_name
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
WHERE tm.user_id = ?;  -- 替换为当前登录用户ID

-- ========================================
-- 3. 检查行程分享记录
-- ========================================
SELECT tps.id, tps.trip_plan_id, tps.team_id, tps.shared_by, 
       tp.title, tp.user_id as trip_owner_id,
       t.name as team_name
FROM trip_plan_shares tps
JOIN trip_plans tp ON tps.trip_plan_id = tp.id
JOIN teams t ON tps.team_id = t.id
WHERE tp.is_active = 1;

-- ========================================
-- 4. 完整的关联查询（模拟Hibernate查询）
-- ========================================
SELECT DISTINCT 
    tp.id, 
    tp.title, 
    tp.destination,
    tp.user_id as trip_owner_id,
    tm.user_id as member_user_id,
    tm.id as team_member_id,
    CASE WHEN tp.user_id = ? THEN 1 ELSE 0 END as is_owner
FROM trip_plans tp
LEFT JOIN trip_plan_shares tps ON tp.id = tps.trip_plan_id
LEFT JOIN team_members tm ON tps.team_id = tm.team_id AND tm.user_id = ?
WHERE (tp.user_id = ? OR tm.id IS NOT NULL)
  AND tp.is_active = 1
ORDER BY tp.created_at DESC;

-- 替换所有 ? 为当前登录用户ID（例如：1）

-- ========================================
-- 5. 检查特定用户应该看到的共享行程
-- ========================================
-- 假设用户ID为1
SELECT 
    tp.id,
    tp.title,
    tp.user_id as owner_id,
    tps.team_id,
    tm.user_id as member_id,
    '共享行程' as type
FROM trip_plans tp
JOIN trip_plan_shares tps ON tp.id = tps.trip_plan_id
JOIN team_members tm ON tps.team_id = tm.team_id
WHERE tm.user_id = 1  -- 当前用户ID
  AND tp.user_id != 1  -- 不是自己创建的
  AND tp.is_active = 1;

-- ========================================
-- 预期结果分析
-- ========================================
-- 查询1：应该返回当前用户信息
-- 查询2：应该返回用户所在的所有团队
-- 查询3：应该返回所有的分享记录
-- 查询4：应该返回用户自己的行程 + 团队分享的行程
-- 查询5：应该只返回团队分享给用户的行程（不包括自己的）

-- ========================================
-- 故障排查检查点
-- ========================================
-- ✅ 检查点1：用户是否在团队中？
--    如果查询2返回空，说明用户不在任何团队中

-- ✅ 检查点2：是否有分享记录？
--    如果查询3返回空，说明没有行程被分享

-- ✅ 检查点3：分享的行程是否分享给了用户所在的团队？
--    检查查询3中的team_id是否在查询2的结果中

-- ✅ 检查点4：行程的is_active是否为true？
--    检查查询3中的行程是否被软删除

-- ✅ 检查点5：LEFT JOIN是否正确关联？
--    查询4应该返回所有符合条件的行程
