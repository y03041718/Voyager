-- =====================================================
-- 旅行计划相关数据表
-- =====================================================

-- 1. 旅行计划主表
CREATE TABLE IF NOT EXISTS trip_plans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '行程ID',
    user_id BIGINT NOT NULL COMMENT '创建者ID',
    
    -- 基本信息（用于列表展示和搜索）
    title VARCHAR(200) COMMENT '行程标题（AI生成）',
    destination VARCHAR(100) COMMENT '目的地城市',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    travelers VARCHAR(50) COMMENT '旅行人数（如：2人、家庭游）',
    style VARCHAR(50) COMMENT '旅行风格（如：文化体验、美食家）',
    
    -- 完整的行程数据（JSON格式，包含所有详细信息）
    plan_data JSON NOT NULL COMMENT '完整行程数据（包含天数、景点、天气、localTips等）',
    
    -- 封面图（从行程内第一张图片提取）
    cover_image VARCHAR(500) COMMENT '封面图片URL',
    
    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否有效（软删除标记）',
    
    -- 索引
    INDEX idx_user_id (user_id) COMMENT '创建者索引',
    INDEX idx_destination (destination) COMMENT '目的地索引',
    INDEX idx_created_at (created_at) COMMENT '创建时间索引',
    INDEX idx_start_date (start_date) COMMENT '开始日期索引',
    
    -- 外键
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='旅行计划表';

-- 2. 行程分享关联表（多对多）
CREATE TABLE IF NOT EXISTS trip_plan_shares (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '分享记录ID',
    trip_plan_id BIGINT NOT NULL COMMENT '行程ID',
    team_id BIGINT NOT NULL COMMENT '团队ID',
    shared_by BIGINT NOT NULL COMMENT '分享者ID',
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '分享时间',
    
    -- 唯一约束：同一个行程不能重复分享给同一个团队
    UNIQUE KEY uk_plan_team (trip_plan_id, team_id) COMMENT '行程-团队唯一约束',
    
    -- 索引
    INDEX idx_team_id (team_id) COMMENT '团队索引',
    INDEX idx_shared_by (shared_by) COMMENT '分享者索引',
    INDEX idx_shared_at (shared_at) COMMENT '分享时间索引',
    
    -- 外键
    FOREIGN KEY (trip_plan_id) REFERENCES trip_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='行程分享表';

-- =====================================================
-- 示例数据说明
-- =====================================================

-- plan_data JSON 结构示例：
-- {
--   "title": "京都古韵文化之旅",
--   "destination": "京都",
--   "localTips": {
--     "culture": "京都是日本的文化古都...",
--     "food": "京都料理以精致著称...",
--     "tips": "春秋季节最适合旅游..."
--   },
--   "days": [
--     {
--       "day": 1,
--       "date": "2024-03-20",
--       "weather": {
--         "temperature": "18",
--         "condition": "晴朗",
--         "feelsLike": "20"
--       },
--       "plans": [
--         {
--           "time": "09:00",
--           "type": "attraction",
--           "id": "B000A7BD6C",
--           "name": "清水寺",
--           "desc": "京都最著名的寺庙之一",
--           "duration": "2小时",
--           "image": "http://store.is.autonavi.com/showpic/xxx",
--           "rating": 4.8,
--           "address": "京都市东山区清水1丁目294",
--           "level": "5A景区",
--           "location": {
--             "lat": 34.9949,
--             "lng": 135.7850
--           }
--         }
--       ]
--     }
--   ]
-- }

-- =====================================================
-- 常用查询示例
-- =====================================================

-- 1. 查询用户的所有行程（列表页）
-- SELECT id, title, destination, start_date, end_date, cover_image, created_at
-- FROM trip_plans
-- WHERE user_id = ? AND is_active = TRUE
-- ORDER BY created_at DESC;

-- 2. 查询行程详情（详情页）
-- SELECT plan_data
-- FROM trip_plans
-- WHERE id = ? AND user_id = ? AND is_active = TRUE;

-- 3. 查询用户可见的所有行程（我的 + 团队分享的）
-- SELECT DISTINCT tp.id, tp.title, tp.destination, tp.start_date, tp.end_date, 
--        tp.cover_image, tp.created_at, tp.user_id,
--        CASE WHEN tp.user_id = ? THEN TRUE ELSE FALSE END as is_owner
-- FROM trip_plans tp
-- LEFT JOIN trip_plan_shares tps ON tp.id = tps.trip_plan_id
-- LEFT JOIN team_members tm ON tps.team_id = tm.team_id AND tm.user_id = ?
-- WHERE (tp.user_id = ? OR tm.user_id IS NOT NULL)
--   AND tp.is_active = TRUE
-- ORDER BY tp.created_at DESC;

-- 4. 查询行程分享到的团队列表
-- SELECT t.id, t.name, tps.shared_at, u.username as shared_by_name
-- FROM trip_plan_shares tps
-- JOIN teams t ON tps.team_id = t.id
-- JOIN users u ON tps.shared_by = u.id
-- WHERE tps.trip_plan_id = ?
-- ORDER BY tps.shared_at DESC;

-- 5. 查询团队的所有分享行程
-- SELECT tp.id, tp.title, tp.destination, tp.start_date, tp.end_date,
--        tp.cover_image, tp.created_at, u.username as creator_name,
--        tps.shared_at, us.username as shared_by_name
-- FROM trip_plan_shares tps
-- JOIN trip_plans tp ON tps.trip_plan_id = tp.id
-- JOIN users u ON tp.user_id = u.id
-- JOIN users us ON tps.shared_by = us.id
-- WHERE tps.team_id = ? AND tp.is_active = TRUE
-- ORDER BY tps.shared_at DESC;
