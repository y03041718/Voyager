-- 团队表
CREATE TABLE IF NOT EXISTS teams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '团队名称',
    invite_code VARCHAR(4) NOT NULL UNIQUE COMMENT '团队邀请码(4位数字)',
    creator_id BIGINT NOT NULL COMMENT '创建者ID',
    description VARCHAR(500) COMMENT '团队描述',
    avatar_url VARCHAR(500) COMMENT '团队头像URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_creator_id (creator_id),
    INDEX idx_invite_code (invite_code),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队表';

-- 团队成员表
CREATE TABLE IF NOT EXISTS team_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT NOT NULL COMMENT '团队ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role VARCHAR(20) DEFAULT 'member' COMMENT '角色: creator(创建者), admin(管理员), member(成员)',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_team_user (team_id, user_id) COMMENT '同一用户在同一团队中唯一',
    INDEX idx_team_id (team_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员表';

-- 修改users表，添加头像字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) COMMENT '用户头像URL';
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(100) COMMENT '用户昵称';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100) COMMENT '用户邮箱';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) COMMENT '用户手机号';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
