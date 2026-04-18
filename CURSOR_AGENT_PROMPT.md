# Cursor Agent Prompt — Ethereal Campus 学生端后端开发

---

## 一、项目概述

**项目名称：** BHSFIC 智慧校园管理系统 — 学生端（Ethereal Campus）

**GitHub 仓库：** `https://github.com/ShawnYin-hub/smart-campus.git`

**项目定位：** 一个面向学生的移动端 SPA，包含管理端 Web + 学生端 App + 共享 FastAPI 后端三个部分。

**当前仓库结构：**

```
smart-campus/
├── ethereal-campus/          ← 学生端 App（React 移动端 SPA）★ 你需要为它写后端
├── backend/                  ← 共享 FastAPI 后端（已为管理端 Web 实现了部分 API）
│   └── app/
│       ├── api/routes/       ← 已实现: auth, users, persons, approvals, notifications, dashboard, briefing
│       ├── models/            ← 已实现: User, Person, ApprovalRequest, Notification, DailyBriefing, AuditLog
│       ├── schemas/           ← 已实现: auth, user, person, approval, common, validators
│       ├── services/         ← 已实现: auth, person, approval, notification, ai_briefing, ai_risk, audit
│       ├── core/             ← config, database, security, types
│       ├── main.py           ← FastAPI 入口
│       └── requirements.txt  ← Python 依赖
├── src/                      ← 管理端 Web（React，已完成，与后端已接入）
└── docker-compose.yml        ← 全栈 Docker 配置
```

---

## 二、你需要完成的工作

**目标：** 为 `ethereal-campus/` 学生端 App 编写 FastAPI 后端，并将 App 接入后端。

**你需要：**

1. 在 `backend/app/` 下新增学生端相关的数据模型（Model）、Pydantic 模式（Schema）、服务层（Service）、API 路由（Route）
2. 将学生端前端 `ethereal-campus/src/` 中所有 Mock 数据调用替换为真实 API 请求
3. 接入方式参考管理端 Web（`src/services/` 下的 `.service.ts` 文件）—— 后端 API 请求规范完全一致

**注意：** 不要改动管理端 Web 的任何代码，只在 `backend/app/` 下新增文件。

---

## 三、学生端 App 现状（完全 Mock，需接入后端）

### 3.1 现有页面与功能清单

#### AuthScreen（登录/注册）
- 输入：姓名 + 学号
- 操作：登录 / 注册切换
- 预期后端行为：
  - 登录：POST `/api/v1/student/auth/login`，传入 `{student_id, password}`，返回 JWT token
  - 注册：POST `/api/v1/student/auth/register`，传入 `{name, student_id, password}`，返回 token
- 当前 Mock：`onLogin` 只修改本地状态，无任何网络请求

#### HomeScreen（工作台）
- 显示：学生姓名 + 日期
- 显示：当前课程卡片（`currentCourse`）
- 显示：今日课表列表（`todaySchedule`）
- 显示：待办事项列表（`upcomingTasks`）
- 底部浮动 AI 助手（暂不实现，可留空）
- 预期后端行为：
  - GET `/api/v1/student/home`（返回首页汇总数据）

#### ScheduleScreen（智慧课表）
- AI OCR 识别：从相册选择图片 → 上传图片 → 后端返回解析的课程列表
- 手动录入：表单提交课程
- 查看当日课表
- 预期后端行为：
  - POST `/api/v1/student/schedule/ocr` — 接收图片 multipart/form-data，返回 `Course[]`
  - POST `/api/v1/student/schedule/add` — 添加课程到学生课表
  - GET `/api/v1/student/schedule/today` — 获取当日课表

#### LeaveScreen（请假服务）
- AI 语音识别（模拟）：点击麦克风 → 语音转文字 → 后端 LLM 提取请假信息
- 手动填写请假表单
- 查看请假申请历史及状态
- 预期后端行为：
  - POST `/api/v1/student/leave/voice-parse` — 接收文本描述，返回解析后的 `{type, dateRange, reason}`
  - POST `/api/v1/student/leave/apply` — 提交请假申请
  - GET `/api/v1/student/leave/history` — 获取请假历史

#### RecognitionScreen（无感通行）
- 人脸录入：拍摄/导入照片上传到后端
- 查看通行历史记录
- 预期后端行为：
  - POST `/api/v1/student/face/register` — 上传人脸照片
  - GET `/api/v1/student/recognition/history` — 获取通行历史

#### SettingsScreen（设置中心）
- 查看个人信息（姓名、学号）
- 修改密码
- 多语言切换（前端本地切换，不涉及后端）
- 退出登录（清除本地 token）
- 预期后端行为：
  - GET `/api/v1/student/profile` — 获取学生档案
  - POST `/api/v1/student/password/change` — 修改密码

### 3.2 数据模型（前端 types.ts 定义）

```typescript
// 已在 ethereal-campus/src/types.ts 中定义

interface UserProfile {
  name: string;
  id: string;        // 学号
  avatarUrl: string;
}

interface Course {
  id: string;
  name: string;
  time: string;      // "09:00 - 10:40"
  location: string;  // "教学楼 A101"
  type: 'science' | 'book' | 'math' | 'calculus';
}

interface Task {
  id: string;
  title: string;
  deadline: string;  // "12月20日"
  type: 'report' | 'reading';
}

interface LeaveRequest {
  id: string;
  type: string;      // '事假' | '病假' | '年假'
  dateRange: string; // '2024-12-05 - 2024-12-06'
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
}

interface RecognitionHistory {
  id: string;
  location: string;  // '校门口' | '食堂'
  time: string;      // '09:00'
  status: 'success' | 'leave';
  type: 'entry' | 'dining' | 'library';
}

interface AppData {
  user: UserProfile;
  school: { name: string; logoUrl: string };
  currentCourse?: Course;
  todaySchedule: Course[];
  upcomingTasks: Task[];
  leaveHistory: LeaveRequest[];
  recognitionHistory: RecognitionHistory[];
}
```

---

## 四、后端参考：管理端 Web 的接入方式

### 4.1 API 基础配置

管理端 Web 的 API 服务层在 `src/services/` 下，参考这些文件理解 API 请求规范：

```typescript
// src/services/api.config.ts 基础配置
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit & { isFormData?: boolean }
): Promise<T> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!options?.isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}
```

### 4.2 Auth 认证

```typescript
// src/services/auth.service.ts
export async function login(data: { username: string; password: string }) {
  const res = await apiRequest<{ access_token: string; token_type: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify(data) }
  );
  localStorage.setItem('access_token', res.access_token);
  return res;
}

export async function getCurrentUser() {
  return apiRequest<UserResponse>('/auth/me');
}

export async function changePassword(data: { old_password: string; new_password: string }) {
  return apiRequest<void>('/auth/change-password', {
    method: 'POST', body: JSON.stringify(data)
  });
}
```

### 4.3 后端路由结构（现有，已实现）

```
/api/v1/auth/login        POST
/api/v1/auth/me           GET
/api/v1/auth/change-password POST
/api/v1/users             GET/POST
/api/v1/persons            GET/POST/PATCH/DELETE
/api/v1/persons/batch-import POST
/api/v1/persons/stats     GET
/api/v1/approvals          GET/POST
/api/v1/approvals/{id}/approve   POST
/api/v1/approvals/{id}/reject    POST
/api/v1/approvals/stats    GET
/api/v1/notifications      GET/POST
/api/v1/dashboard/overview GET
/api/v1/dashboard/alerts   GET
/api/v1/briefing/today     GET
/api/v1/briefing/generate  POST
```

---

## 五、你需要新增的后端 API（学生端）

### 5.1 路由前缀：`/api/v1/student/`

| HTTP | 端点 | 说明 |
|------|------|------|
| POST | `/student/auth/login` | 学生登录（学号+密码） |
| POST | `/student/auth/register` | 学生注册 |
| GET | `/student/auth/me` | 获取当前学生信息 |
| GET | `/student/home` | 首页汇总数据 |
| GET | `/student/profile` | 学生档案 |
| POST | `/student/password/change` | 修改密码 |
| GET | `/student/schedule/today` | 获取当日课表 |
| POST | `/student/schedule/ocr` | OCR 识别课表图片 |
| POST | `/student/schedule/add` | 添加课程 |
| GET | `/student/leave/history` | 请假历史 |
| POST | `/student/leave/apply` | 提交请假申请 |
| POST | `/student/leave/voice-parse` | 语音/文字解析请假信息 |
| POST | `/student/face/register` | 人脸照片上传 |
| GET | `/student/recognition/history` | 通行记录 |

### 5.2 数据模型建议

**新增 Model 文件：**
- `backend/app/models/student.py` — Student 模型（关联现有 User 或新建）
- `backend/app/models/student_schedule.py` — 学生课表模型
- `backend/app/models/student_leave.py` — 学生请假申请模型
- `backend/app/models/student_face.py` — 人脸注册记录模型
- `backend/app/models/student_access_log.py` — 通行记录模型

**新增 Schema 文件：**
- `backend/app/schemas/student.py` — 学生相关 Pydantic Schema

**新增 Service 文件：**
- `backend/app/services/student_service.py` — 学生档案逻辑
- `backend/app/services/student_schedule_service.py` — 课表逻辑（含 OCR）
- `backend/app/services/student_leave_service.py` — 请假逻辑
- `backend/app/services/student_face_service.py` — 人脸注册逻辑

**新增 Route 文件：**
- `backend/app/api/routes/student.py` — 聚合路由（在 `main.py` 中 include）

### 5.3 关键实现细节

#### OCR 识别（POST `/student/schedule/ocr`）
- 接收 `multipart/form-data` 中的图片文件
- 调用 DeepSeek / Gemini 等 LLM 多模态 API，将图片内容解析为课程 JSON
- 参考现有 `ai_briefing_service.py` 和 `ai_risk_service.py` 的 API 调用方式
- 返回格式：`[{ "name": "大学物理", "time": "14:00 - 15:40", "location": "实验楼 302", "type": "science" }]`

#### 语音/文字解析请假（POST `/student/leave/voice-parse`）
- 接收 JSON：`{ "text": "我明天感冒了，需要请假两天" }`
- 调用 LLM 提取结构化请假信息（type, dateRange, reason）
- 参考现有 AI 服务实现方式

#### 人脸照片上传（POST `/student/face/register`）
- 接收 `multipart/form-data` 中的图片文件
- 保存到本地存储或云存储（如需存储服务可简化处理）
- 返回注册结果

---

## 六、学生端前端接入指南

### 6.1 新增 API 服务层文件

在 `ethereal-campus/src/services/` 下新建：

```
ethereal-campus/src/services/
├── api.config.ts           ← 复用管理端的配置方式（带 Bearer token）
├── auth.service.ts         ← 学生登录/注册/登出
├── schedule.service.ts     ← 课表相关 API
├── leave.service.ts        ← 请假相关 API
└── student.service.ts      ← 学生档案/人脸
```

### 6.2 API 请求基础配置（参考管理端）

```typescript
// ethereal-campus/src/services/api.config.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function apiRequest<T>(endpoint: string, options?: RequestInit & { isFormData?: boolean }): Promise<T> {
  const token = localStorage.getItem('student_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!options?.isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
```

### 6.3 AuthScreen 接入

```typescript
// 登录成功后保存 token
const res = await login({ student_id, password }); // 或 { username, password }
localStorage.setItem('student_token', res.access_token);
```

### 6.4 后端跨域配置

确保 `backend/app/main.py` 中 CORS 配置允许学生端 dev server（通常是 `http://localhost:3000`）。

---

## 七、技术规范

- **Python：** 3.12，使用 FastAPI
- **数据库：** 复用现有 SQLAlchemy + SQLite（开发）/ PostgreSQL（生产）
- **AI：** DeepSeek API（参考 `backend/app/services/ai_briefing_service.py` 的调用方式）
- **认证：** JWT Bearer Token，与管理端风格一致
- **图片上传：** FastAPI `UploadFile`，multipart/form-data
- **不要**使用 Firebase、Supabase 等新的第三方后端服务，**保持与现有 FastAPI 后端一致**

---

## 八、验收标准

完成后，以下功能应能从 Mock 切换为真实 API：

1. ✅ 学生登录/注册 → 真实 JWT 认证
2. ✅ 首页工作台 → 真实获取学生课表和待办
3. ✅ 课表 OCR 识别 → 调用 AI 解析真实图片
4. ✅ 手动添加课程 → 持久化到数据库
5. ✅ 请假申请提交 → 写入数据库（复用管理端 ApprovalRequest 模型 或新建 StudentLeave 模型）
6. ✅ 请假语音解析 → 调用 LLM 提取请假信息
7. ✅ 人脸录入 → 上传图片到服务器
8. ✅ 查看通行记录 → 从数据库读取
9. ✅ 修改密码 → 真实更新密码
10. ✅ Settings 个人信息 → 真实读取学生档案

---

## 九、禁止事项

- ❌ 不要删除或修改管理端 Web 的任何代码（`src/` 目录）
- ❌ 不要修改 `backend/app/main.py` 中管理端已有的路由
- ❌ 不要修改 `backend/app/models/` 中管理端已有的 Model
- ❌ 不要引入新的数据库（全部复用现有 SQLite/PostgreSQL）
- ❌ 不要在 git 仓库中提交 `.env` 文件（包含 secrets）

---

## 十、项目启动方式

```bash
# 后端（开发）
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 学生端 App（开发）
cd ethereal-campus
npm install
npm run dev
```
