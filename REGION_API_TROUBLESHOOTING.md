# Region API 404问题排查指南

## 问题现象
访问 `http://localhost:8080/api/regions/provinces` 返回404错误

## 排查步骤

### 1. 确认后端已启动
检查IDEA控制台，确保看到：
```
Started VoyagerDemoApplication in X.XXX seconds
```

### 2. 检查端口
确认应用运行在8080端口：
```
Tomcat started on port(s): 8080 (http)
```

### 3. 测试简单端点
访问测试端点：
```
http://localhost:8080/api/regions/test
```

**预期结果**：`RegionController is working!`

### 4. 检查映射日志
在启动日志中搜索 "Mapped"，应该看到：
```
Mapped "{[/api/regions/test]}" onto ...
Mapped "{[/api/regions/provinces]}" onto ...
```

### 5. 检查数据库连接
确保region表已创建并有数据：
```sql
SELECT * FROM region;
```

### 6. 使用Maven重新编译
```bash
mvn clean install
```

### 7. 检查application.yml
确保没有配置context-path：
```yaml
server:
  port: 8080
  # 不要有 servlet.context-path 配置
```

## 常见问题

### 问题1：Controller未被扫描
**症状**：启动日志中没有看到 `/api/regions` 的映射

**解决方案**：
1. 确认RegionController在 `com.example.voyagerdemo.controller` 包下
2. 确认类上有 `@RestController` 注解
3. 重新Build项目

### 问题2：依赖缺失
**症状**：编译错误或启动失败

**解决方案**：
检查pom.xml是否包含必要依赖：
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

### 问题3：Security配置问题
**症状**：返回401而不是404

**解决方案**：
确认SecurityConfig中已放行：
```java
.requestMatchers("/api/regions/provinces").permitAll()
.requestMatchers("/api/regions/cities").permitAll()
```

### 问题4：数据库表不存在
**症状**：访问provinces端点时报SQL错误

**解决方案**：
```sql
-- 执行建表脚本
source database/region_poi_tables.sql;

-- 验证表已创建
SHOW TABLES LIKE 'region';
```

## 快速验证脚本

### 后端验证
```bash
# 1. 测试端点
curl http://localhost:8080/api/regions/test

# 2. 获取省份列表
curl http://localhost:8080/api/regions/provinces

# 3. 获取城市列表
curl "http://localhost:8080/api/regions/cities?province=京都府"
```

### 数据库验证
```sql
-- 检查region表
SELECT COUNT(*) FROM region;

-- 检查省份数据
SELECT DISTINCT province FROM region;

-- 检查完整数据
SELECT * FROM region ORDER BY province, city;
```

## 如果仍然404

### 方法1：使用其他Controller的路径测试
访问已知可用的端点：
```
http://localhost:8080/api/auth/login
```

如果这个也404，说明整个应用的路由有问题。

### 方法2：检查IDEA配置
1. File → Project Structure
2. 确认SDK配置正确
3. 确认Modules配置正确

### 方法3：清理并重启
```bash
# 停止应用
# 在IDEA中：Build → Clean Project
# 然后：Build → Rebuild Project
# 最后重新运行应用
```

### 方法4：检查防火墙
确保8080端口没有被防火墙阻止：
```bash
# Windows
netstat -ano | findstr :8080

# 应该看到LISTENING状态
```

## 成功标志

当一切正常时，你应该能：

1. ✅ 访问 `http://localhost:8080/api/regions/test` 看到 "RegionController is working!"
2. ✅ 访问 `http://localhost:8080/api/regions/provinces` 看到省份JSON数组
3. ✅ 前端RegionSelector组件能加载省份列表
4. ✅ 控制台日志显示 "✅ 省份列表加载成功"

## 联系支持

如果以上步骤都无法解决问题，请提供：
1. 完整的启动日志
2. 访问API时的完整错误信息
3. `SELECT * FROM region` 的查询结果
4. IDEA的Maven依赖树截图
