# BHSFIC 智能校园系统 — 后端架构设计文档

> 版本：v1.0.0 | 日期：2026-04-17 | 适用范围：Phase 1 Web 大屏 RESTful API

---

## 1. 系统愿景与设计原则

**核心目标**：为校方管理层提供"无感、免责、提效"的智慧校园管理平台。

**架构原则**：
- **前后端完全分离**：FastAPI 后端仅暴露 RESTful API，无模板渲染
- **无状态鉴权**：JWT Token 承载所有认证信息，支持 Admin 与 Student 双角色
- **数据库优先**：所有业务数据入 PostgreSQL，不依赖厂商锁定
- **Docker 优先**：所有服务容器化，确保 10 年+ 可迁移性
- **AI 即服务**：DeepSeek API 通过统一 Service 层调用，便于后续替换模型

---

## 2. 技术栈选型

| 层级 | 技术选型 | 选型理由 |
|------|----------|----------|
| Web 框架 | FastAPI 0.115+ | 高性能异步、自动 OpenAPI 文档、类型安全 |
| ORM | SQLAlchemy 2.0（异步模式） | 全面类型提示、Alembic 迁移支持 |
| 数据库 | PostgreSQL 16 | 成熟稳定、JSONB 支持、十年+生态 |
| 迁移工具 | Alembic | SQLAlchemy 官方推荐，与模型同步 |
| 认证 | JWT (PyJWT) + OAuth2 Password Flow | 业界标准，前后端/移动端通用 |
| AI 模型 | DeepSeek Chat API | 用户已有 API Key，统一 Service 封装 |
| 部署 | Docker + docker-compose | 跨云迁移，零依赖运维 |
| 序列化 | Pydantic v2 | 与 FastAPI 深度集成，类型校验 |

---

## 3. 目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # 环境变量配置（Pydantic Settings）
│   │   ├── database.py         # SQLAlchemy 异步引擎 + Session
│   │   └── security.py         # JWT 生成/验证、密码哈希
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py             # 用户模型（管理员）
│   │   ├── person.py            # 师生档案模型
│   │   ├── approval.py          # 审批请求模型
│   │   ├── audit_log.py         # 审计日志模型
│   │   └── briefing.py          # AI 晨报模型
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py              # 登录/Token 的 Pydantic 模型
│   │   ├── user.py              # 用户相关 Pydantic 模型
│   │   ├── person.py            # 人员相关 Pydantic 模型
│   │   ├── approval.py          # 审批相关 Pydantic 模型
│   │   └── common.py            # 分页、通用响应模型
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py       # 认证业务逻辑
│   │   ├── person_service.py     # 人员管理业务逻辑
│   │   ├── approval_service.py    # 审批业务逻辑
│   │   ├── ai_briefing_service.py # AI 晨报生成服务
│   │   ├── ai_risk_service.py     # AI 风控打标服务
│   │   └── audit_service.py       # 审计日志服务
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py           # 登录登出路由
│   │       ├── users.py          # 管理员管理路由
│   │       ├── persons.py         # 师生档案路由
│   │       ├── approvals.py      # 审批路由
│   │       ├── briefing.py       # AI 晨报路由
│   │       └── dashboard.py       # 总览数据路由
│   └── alembic/
│       ├── env.py
│       └── versions/
├── .env.example
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

---

## 4. 数据库模型设计

### 4.1 User（管理员/操作员）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | UUID | 主键 | PK |
| username | VARCHAR(50) | 登录账号 | UNIQUE, NOT NULL |
| email | VARCHAR(100) | 邮箱 | UNIQUE, NOT NULL |
| hashed_password | VARCHAR(255) | bcrypt 哈希密码 | NOT NULL |
| full_name | VARCHAR(100) | 显示名称 | |
| role | ENUM | admin / operator | DEFAULT 'operator' |
| is_active | BOOLEAN | 账户状态 | DEFAULT TRUE |
| created_at | TIMESTAMP | 创建时间 | |
| updated_at | TIMESTAMP | 更新时间 | |

### 4.2 Person（师生档案）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | UUID | 主键 | PK |
| student_id | VARCHAR(30) | 学号/工号 | UNIQUE, NOT NULL |
| name | VARCHAR(100) | 姓名 | NOT NULL |
| dept | VARCHAR(100) | 部门/班级 | |
| role_type | ENUM | student / teacher | NOT NULL |
| phone | VARCHAR(20) | 联系电话 | |
| id_card | VARCHAR(20) | 身份证号 | |
| face_registered | BOOLEAN | 人脸是否录入 | DEFAULT FALSE |
| face_image_url | VARCHAR(500) | 人脸图片地址 | |
| device_id | VARCHAR(50) | 绑定的硬件设备ID | **预留给 Phase 2 MQTT** |
| device_bind_time | TIMESTAMP | 设备绑定时间 | **预留给 Phase 2** |
| created_at | TIMESTAMP | 创建时间 | |
| updated_at | TIMESTAMP | 更新时间 | |

### 4.3 ApprovalRequest（审批请求）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | UUID | 主键 | PK |
| person_id | UUID | 申请人（FK → Person） | FK |
| type | ENUM | leave_school / visitor / other | NOT NULL |
| start_time | DATETIME | 开始时间 | |
| end_time | DATETIME | 结束时间 | |
| reason | TEXT | 申请事由 | NOT NULL |
| risk_level | ENUM | high / low | AI 自动打标 |
| risk_reason | TEXT | AI 打标理由 | |
| alert | BOOLEAN | 是否高风险告警 | DEFAULT FALSE |
| status | ENUM | pending / approved / rejected | DEFAULT 'pending' |
| reviewed_by | UUID | 审批人（FK → User） | NULLABLE |
| reviewed_at | TIMESTAMP | 审批时间 | NULLABLE |
| review_comment | TEXT | 审批意见 | |
| created_at | TIMESTAMP | 提交时间 | |
| updated_at | TIMESTAMP | 更新时间 | |

### 4.4 AuditLog（审计日志）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | UUID | 主键 | PK |
| user_id | UUID | 操作人（FK → User） | NOT NULL |
| action | VARCHAR(50) | 操作类型 | NOT NULL |
| resource_type | VARCHAR(50) | 资源类型 | |
| resource_id | UUID | 资源ID | |
| detail | JSONB | 操作详情 | |
| ip_address | VARCHAR(45) | 操作 IP | |
| user_agent | VARCHAR(500) | 浏览器 UA | |
| created_at | TIMESTAMP | 操作时间 | |

### 4.5 DailyBriefing（AI 晨报）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | UUID | 主键 | PK |
| title | VARCHAR(200) | 标题 | |
| content | TEXT | AI 生成内容 | NOT NULL |
| tags | JSONB | 标签数组 | |
| date | DATE | 对应日期 | UNIQUE, NOT NULL |
| generated_by | UUID | 生成人（FK → User） | |
| created_at | TIMESTAMP | 生成时间 | |

---

## 5. API 路由设计

所有路由前缀：`/api/v1`

### 5.1 认证模块 `/auth`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/auth/login` | 用户登录，返回 JWT | Public |
| POST | `/auth/logout` | 退出登录（前端清除 Token） | Auth |
| GET | `/auth/me` | 获取当前用户信息 | Auth |

### 5.2 管理员模块 `/users`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/users` | 获取管理员列表 | Admin |
| POST | `/users` | 创建管理员 | Admin |
| GET | `/users/{id}` | 获取管理员详情 | Admin |
| PUT | `/users/{id}` | 更新管理员信息 | Admin |
| DELETE | `/users/{id}` | 删除管理员 | Admin |

### 5.3 人员档案模块 `/persons`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/persons` | 分页获取人员列表（支持搜索） | Auth |
| POST | `/persons` | 新增人员档案 | Admin |
| POST | `/persons/batch` | 批量导入（Excel → JSON） | Admin |
| GET | `/persons/{id}` | 获取人员详情 | Auth |
| PUT | `/persons/{id}` | 更新人员档案 | Admin |
| DELETE | `/persons/{id}` | 删除人员档案 | Admin |
| GET | `/persons/stats` | 获取人员统计（录入率等） | Auth |
| POST | `/persons/{id}/face` | 上传人脸图片 | Auth |

### 5.4 审批模块 `/approvals`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/approvals` | 分页获取审批列表（支持 Tab 筛选） | Auth |
| POST | `/approvals` | 创建审批请求（Student App 调用） | Student / Admin |
| GET | `/approvals/{id}` | 获取审批详情 | Auth |
| POST | `/approvals/{id}/approve` | 审批通过 | Admin |
| POST | `/approvals/{id}/reject` | 审批拒绝 | Admin |
| GET | `/approvals/stats` | 获取审批统计数据 | Auth |

### 5.5 AI 晨报模块 `/briefing`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/briefing/today` | 获取今日晨报 | Auth |
| POST | `/briefing/generate` | 手动触发 AI 生成晨报 | Admin |

### 5.6 总览大屏模块 `/dashboard`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/dashboard/overview` | 总览数据（晨报+统计+告警） | Auth |
| GET | `/dashboard/alerts` | 紧急告警列表（对接 OverviewView） | Auth |

---

## 6. JWT 鉴权体系

### Token 结构

```json
{
  "sub": "<user_id (UUID)>",
  "username": "<username>",
  "role": "admin | operator | student",
  "exp": "<过期时间（默认8小时）>",
  "iat": "<签发时间>"
}
```

### 角色权限矩阵

| 操作 | Admin | Operator | Student |
|------|-------|----------|---------|
| 登录 | ✅ | ✅ | ✅ |
| 管理管理员账号 | ✅ | ❌ | ❌ |
| 增删改人员档案 | ✅ | ✅ | ❌ |
| 查看人员档案 | ✅ | ✅ | ❌（仅自己） |
| 提交审批申请 | ✅ | ✅ | ✅ |
| 审批通过/拒绝 | ✅ | ✅ | ❌ |
| 查看审批列表 | ✅ | ✅ | ❌（仅自己） |
| 生成 AI 晨报 | ✅ | ❌ | ❌ |
| 查看总览大屏 | ✅ | ✅ | ❌ |

### 前端使用方式

前端在 `localStorage` 中存储 JWT，调用 API 时通过 `Authorization: Bearer <token>` 头传递。
未来 UniApp 学生端同理，共用同一套 API。

---

## 7. AI 服务设计

### 7.1 AI 风控打标服务 (`ai_risk_service`)

**触发时机**：审批申请提交时（自动调用）

**调用 DeepSeek API**，Prompt 模板：
```
你是一个校园安全风控专家。请根据以下请假申请信息，判断该申请是否为高风险。

申请人：[姓名] [学号]
申请类型：[离校申请/访客申请]
请假时间：[开始时间] 至 [结束时间]
请假事由：[事由描述]

高风险判断标准：
- 长时间请假（超过3天）
- 节假日前后请假
- 夜间外出（22:00后）
- 理由模糊或异常
- 其他安全疑点

请返回 JSON 格式：
{
  "risk_level": "high" | "low",
  "risk_reason": "<判断理由，50字以内>",
  "alert": true | false
}
```

### 7.2 AI 晨报生成服务 (`ai_briefing_service`)

**触发时机**：每日早上 7:00 自动生成，或管理员手动触发

**调用 DeepSeek API**，输入当日数据：
- 今日待审批数量
- 高风险审批数量
- 门禁异常记录（Phase 2）
- 人员出勤统计
- 近期审批通过率

**输出**：自然语言晨报，包含标题、内容摘要、标签数组

### 7.3 AI 数据清洗服务

**触发时机**：批量导入 Excel 后异步调用

输入：原始 Excel 数据列表
输出：纠错后数据列表（身份证号格式修正、部门归属建议等）

---

## 8. Docker 部署架构

```
┌─────────────────────────────────────────┐
│         docker-compose.yml               │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐   ┌───────────────┐   │
│  │   FastAPI   │   │  PostgreSQL   │   │
│  │  (uvicorn)  │──▶│   (官方镜像)   │   │
│  │   :8000     │   │   :5432       │   │
│  └─────────────┘   └───────────────┘   │
│         │                                │
│         │ :8000 → 映射到宿主机 80 端口    │
│         │ （反向代理/域名解析交给 Nginx）  │
│         │                               │
└─────────────────────────────────────────┘
```

**最小资源占用**：
- FastAPI：uvicorn，单 worker（Gunicorn 可选，Phase 2 再加）
- PostgreSQL：共享内存优化，不超 256MB

---

## 9. 环境变量设计

```env
# 数据库
DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/smart_campus

# JWT 密钥（生产必须更换）
SECRET_KEY=<随机64位密钥>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# DeepSeek AI
DEEPSEEK_API_KEY=sk-xxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# CORS（前端地址）
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://your-frontend-domain.com"]

# 服务器
DEBUG=false
```

---

## 10. Phase 2 扩展预留

| 预留设计 | 具体实现 |
|----------|----------|
| MQTT 硬件接入 | `Person.device_id` + `device_bind_time` 已建模；门禁日志表可新增 |
| 实时大屏 | WebSocket 支持（FastAPI 支持，后续加 `APIRouter.ws`） |
| 学生端 App | 共用 API，通过 `role=student` 权限拦截区分 |
| 人脸识别 | `Person.face_image_url` + 人脸比对服务预留接口 |
| 短信/邮件通知 | AuditLog 触发通知 Service（可接入阿里云/腾讯云） |
