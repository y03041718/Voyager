-- 省市表
CREATE TABLE IF NOT EXISTS region (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    province VARCHAR(50) NOT NULL COMMENT '省份名称',
    city VARCHAR(50) COMMENT '城市名称，为NULL表示仅省级',
    display_name VARCHAR(100) NOT NULL COMMENT '显示名称',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_province_city (province, city),
    INDEX idx_province (province)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='省市表';

-- POI推荐表
CREATE TABLE IF NOT EXISTS poi (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    region_id BIGINT NOT NULL COMMENT '关联的省市ID',
    amap_id VARCHAR(100) NOT NULL COMMENT '高德POI ID',
    name VARCHAR(200) NOT NULL COMMENT 'POI名称',
    type VARCHAR(50) NOT NULL COMMENT 'POI类型：attraction/hotel/restaurant',
    address VARCHAR(500) COMMENT '地址',
    location_lat DECIMAL(10, 7) NOT NULL COMMENT '纬度',
    location_lng DECIMAL(10, 7) NOT NULL COMMENT '经度',
    rating DECIMAL(3, 1) COMMENT '评分',
    tel VARCHAR(50) COMMENT '电话',
    star_level VARCHAR(20) COMMENT '酒店星级',
    level VARCHAR(20) COMMENT '景点等级',
    cost VARCHAR(20) COMMENT '人均消费',
    photos TEXT COMMENT '图片URL列表，JSON格式',
    amap_type VARCHAR(100) COMMENT '高德POI类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_region_amap_id (region_id, amap_id),
    INDEX idx_region_type (region_id, type),
    INDEX idx_name_location (name, location_lat, location_lng),
    FOREIGN KEY (region_id) REFERENCES region(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='POI推荐表';

-- 插入初始省市数据（示例）
INSERT INTO region (province, city, display_name) VALUES
('京都府', '京都市', '京都市'),
('京都府', NULL, '京都府'),
('大阪府', '大阪市', '大阪市'),
('大阪府', NULL, '大阪府'),
('东京都', '东京', '东京'),
('东京都', NULL, '东京都'),
('北海道', '札幌市', '札幌市'),
('北海道', NULL, '北海道'),
('神奈川县', '横滨市', '横滨市'),
('神奈川县', NULL, '神奈川县'),
('奈良县', '奈良市', '奈良市'),
('奈良县', NULL, '奈良县');
