# 用户资料和团队管理 API 文档

## 概述

本文档描述了用户资料管理和团队管理相关的所有API接口。

## 基础信息

- 基础URL: `http://localhost:8080/api`
- 认证方式: 所有接口都需要登录认证（除了登录和注册接口）
- 请求头: `Content-Type: application/json`

---

## 用户资料管理 API

### 1. 获取当前用户信息

**接口**: `GET /api/profile`

**描述**: 获取当前登录用户的详细信息

**请求示例**:
```http
GET /api/profile
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "id": 1,
  "username": "zhangsan",
  "nickname": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138000",
  "avatarUrl": "https://example.com/avatar.jpg",
  "teamName": "旅行团",
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-02T15:30:00"
}
```

---

### 2. 更新用户资料

**接口**: `PUT /api/profile`

**描述**: 更新当前用户的资料信息（不包括用户名和密码）

**请求体**:
```json
{
  "nickname": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138000",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**字段说明**:
- `nickname`: 昵称（可选）
- `email`: 邮箱（可选）
- `phone`: 手机号（可选）
- `avatarUrl`: 头像URL（可选）

**响应示例**:
```json
{
  "id": 1,
  "username": "zhangsan",
  "nickname": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138000",
  "avatarUrl": "https://example.com/avatar.jpg",
  "updatedAt": "2024-01-02T15:30:00"
}
```

---

### 3. 修改密码

**接口**: `PUT /api/profile/password`

**描述**: 修改当前用户的登录密码

**请求体**:
```json
{
  "oldPassword": "old123456",
  "newPassword": "new123456"
}
```

**字段说明**:
- `oldPassword`: 旧密码（必填）
- `newPassword`: 新密码（必填）

**响应示例**:
```json
"密码修改成功"
```

**错误响应**:
```json
"旧密码不正确"
```

---

## 团队管理 API

### 1. 创建团队

**接口**: `POST /api/teams`

**描述**: 创建一个新团队，创建者自动成为团队成员

**请求体**:
```json
{
  "name": "家庭旅行团",
  "description": "我们的家庭旅行计划",
  "avatarUrl": "https://example.com/team-avatar.jpg"
}
```

**字段说明**:
- `name`: 团队名称（必填）
- `description`: 团队描述（可选）
- `avatarUrl`: 团队头像URL（可选）

**响应示例**:
```json
{
  "id": 1,
  "name": "家庭旅行团",
  "description": "我们的家庭旅行计划",
  "avatarUrl": "https://example.com/team-avatar.jpg",
  "creatorId": 1,
  "creatorName": "zhangsan",
  "createdAt": "2024-01-01T10:00:00",
  "members": [
    {
      "id": 1,
      "userId": 1,
      "username": "zhangsan",
      "nickname": "张三",
      "avatarUrl": "https://example.com/avatar.jpg",
      "role": "creator",
      "joinedAt": "2024-01-01T10:00:00"
    }
  ]
}
```

---

### 2. 获取用户的所有团队

**接口**: `GET /api/teams`

**描述**: 获取当前用户创建的和加入的所有团队列表

**请求示例**:
```http
GET /api/teams
Authorization: Bearer {token}
```

**响应示例**:
```json
[
  {
    "id": 1,
    "name": "家庭旅行团",
    "description": "我们的家庭旅行计划",
    "avatarUrl": "https://example.com/team-avatar.jpg",
    "creatorId": 1,
    "creatorName": "zhangsan",
    "createdAt": "2024-01-01T10:00:00",
    "members": [
      {
        "id": 1,
        "userId": 1,
        "username": "zhangsan",
        "role": "creator",
        "joinedAt": "2024-01-01T10:00:00"
      },
      {
        "id": 2,
        "userId": 2,
        "username": "lisi",
        "role": "member",
        "joinedAt": "2024-01-02T11:00:00"
      }
    ]
  }
]
```

---

### 3. 获取团队详情

**接口**: `GET /api/teams/{teamId}`

**描述**: 获取指定团队的详细信息（需要是团队成员）

**路径参数**:
- `teamId`: 团队ID

**请求示例**:
```http
GET /api/teams/1
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "id": 1,
  "name": "家庭旅行团",
  "description": "我们的家庭旅行计划",
  "avatarUrl": "https://example.com/team-avatar.jpg",
  "creatorId": 1,
  "creatorName": "zhangsan",
  "createdAt": "2024-01-01T10:00:00",
  "members": [
    {
      "id": 1,
      "userId": 1,
      "username": "zhangsan",
      "nickname": "张三",
      "avatarUrl": "https://example.com/avatar.jpg",
      "role": "creator",
      "joinedAt": "2024-01-01T10:00:00"
    }
  ]
}
```

---

### 4. 更新团队信息

**接口**: `PUT /api/teams/{teamId}`

**描述**: 更新团队信息（只有创建者可以操作）

**路径参数**:
- `teamId`: 团队ID

**请求体**:
```json
{
  "name": "新的团队名称",
  "description": "新的团队描述",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**字段说明**:
- 所有字段都是可选的，只更新提供的字段

**响应示例**:
```json
{
  "id": 1,
  "name": "新的团队名称",
  "description": "新的团队描述",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "creatorId": 1,
  "creatorName": "zhangsan",
  "updatedAt": "2024-01-03T14:00:00"
}
```

---

### 5. 添加团队成员

**接口**: `POST /api/teams/{teamId}/members`

**描述**: 向团队添加新成员（只有创建者可以操作）

**路径参数**:
- `teamId`: 团队ID

**请求体**:
```json
{
  "username": "lisi"
}
```

**字段说明**:
- `username`: 要添加的用户名（必填）

**响应示例**:
```json
"添加成员成功"
```

**错误响应**:
- `"用户不存在"` - 指定的用户名不存在
- `"该用户已经是团队成员"` - 用户已在团队中
- `"只有创建者可以添加成员"` - 无权限

---

### 6. 删除团队成员

**接口**: `DELETE /api/teams/{teamId}/members/{memberUserId}`

**描述**: 从团队中删除成员（只有创建者可以操作，不能删除创建者自己）

**路径参数**:
- `teamId`: 团队ID
- `memberUserId`: 要删除的成员用户ID

**请求示例**:
```http
DELETE /api/teams/1/members/2
Authorization: Bearer {token}
```

**响应示例**:
```json
"删除成员成功"
```

**错误响应**:
- `"只有创建者可以删除成员"` - 无权限
- `"不能删除创建者"` - 不能删除创建者自己

---

### 7. 退出团队

**接口**: `POST /api/teams/{teamId}/leave`

**描述**: 成员退出团队（创建者不能退出，只能删除团队）

**路径参数**:
- `teamId`: 团队ID

**请求示例**:
```http
POST /api/teams/1/leave
Authorization: Bearer {token}
```

**响应示例**:
```json
"退出团队成功"
```

**错误响应**:
```json
"创建者不能退出团队，请删除团队"
```

---

### 8. 删除团队

**接口**: `DELETE /api/teams/{teamId}`

**描述**: 删除团队（只有创建者可以操作，且团队中不能有其他成员）

**路径参数**:
- `teamId`: 团队ID

**请求示例**:
```http
DELETE /api/teams/1
Authorization: Bearer {token}
```

**响应示例**:
```json
"删除团队成功"
```

**错误响应**:
- `"只有创建者可以删除团队"` - 无权限
- `"团队还有其他成员，请先移除所有成员"` - 团队中还有其他成员

---

## 错误码说明

| HTTP状态码 | 说明 |
|-----------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误或业务逻辑错误 |
| 401 | 未认证或认证失败 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 数据库表结构

### users 表
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    team_name VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### teams 表
```sql
CREATE TABLE teams (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    creator_id BIGINT NOT NULL,
    description VARCHAR(500),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);
```

### team_members 表
```sql
CREATE TABLE team_members (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    team_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY (team_id, user_id)
);
```

---

## 使用示例

### 完整流程示例

#### 1. 用户登录
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"123456"}'
```

#### 2. 更新用户资料
```bash
curl -X PUT http://localhost:8080/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"nickname":"张三","email":"zhangsan@example.com"}'
```

#### 3. 创建团队
```bash
curl -X POST http://localhost:8080/api/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"name":"家庭旅行团","description":"我们的家庭旅行"}'
```

#### 4. 添加团队成员
```bash
curl -X POST http://localhost:8080/api/teams/1/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"username":"lisi"}'
```

#### 5. 获取团队列表
```bash
curl -X GET http://localhost:8080/api/teams \
  -H "Authorization: Bearer {token}"
```

---

## 注意事项

1. **权限控制**
   - 只有创建者可以修改团队信息、添加/删除成员、删除团队
   - 普通成员只能查看团队信息和退出团队

2. **数据验证**
   - 用户名不可修改
   - 添加成员时会检查用户是否存在
   - 删除团队前必须先移除所有其他成员

3. **安全性**
   - 所有接口都需要认证
   - 密码使用BCrypt加密存储
   - 修改密码需要验证旧密码

4. **数据完整性**
   - 使用外键约束保证数据一致性
   - 删除用户时会级联删除相关的团队和成员记录

---

## 前端集成示例

### React + TypeScript

```typescript
// api.ts
export const profileApi = {
  // 获取用户信息
  getProfile: async () => {
    const response = await fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  // 更新用户资料
  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // 修改密码
  changePassword: async (data: ChangePasswordRequest) => {
    const response = await fetch('/api/profile/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.text();
  }
};

export const teamApi = {
  // 创建团队
  createTeam: async (data: CreateTeamRequest) => {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // 获取团队列表
  getTeams: async () => {
    const response = await fetch('/api/teams', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  // 添加成员
  addMember: async (teamId: number, username: string) => {
    const response = await fetch(`/api/teams/${teamId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username })
    });
    return response.text();
  }
};
```

---

## 更新日志

- **2024-01-01**: 初始版本，包含用户资料和团队管理功能
