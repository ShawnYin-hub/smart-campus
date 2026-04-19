# Cursor Agent Prompt — 智能校园系统 服务器端部署 + 学生端后端开发

---

## 一、项目概述

### 项目定位

**BHSFIC 智能校园管理系统** — 一个面向校园的智慧管理平台，分为三个组成部分：

| 组成部分 | 说明 | 状态 |
|---------|------|------|
| **管理端 Web** | 面向管理员/老师的 Web 管理界面 | ✅ 已完成，前后端已接入 |
| **学生端 App v2** | 面向学生的移动端 React SPA（ethereal-campus-2） | ✅ 前端已完成，后端已完成（前后端已接入） |
| **共享 FastAPI 后端** | 管理端 + 学生端共用同一后端 | ✅ 管理端 API + 学生端 API 全部完成 |

### GitHub 仓库

```
https://github.com/ShawnYin-hub/smart-campus
```

---

## 二、仓库结构

```
smart-campus/
├── docker-compose.yml          # ★ 全栈部署配置（前端+后端+数据库）
├── frontend.Dockerfile         # ★ 前端多阶段构建（Node → Nginx）
├── nginx.conf                  # ★ Nginx 配置（静态服务 + API 反向代理）
├── deploy.sh                   # 一键部署脚本
├── DEPLOY.md                   # 部署文档
├── public/fonts/               # 本地字体包（解决 Google Fonts CORS 问题）
│   ├── UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2   # Inter 字体
│   └── xn7gYHE41ni1AdIRggexSg.woff2                   # Manrope 字体
│
├── src/                        # ★ 管理端 Web（React，已完成，已接入后端）
│   ├── services/               # API 服务层（auth.service.ts 等）
│   ├── App.tsx
│   └── components/
│       ├── OverviewView/
│       ├── ApprovalView/
│       ├── PersonnelView/
│       ├── NotificationCenter/
│       └── SettingsView/
│
├── backend/                    # ★ 共享 FastAPI 后端
│   ├── Dockerfile              # 生产后端镜像
│   ├── requirements.txt        # Python 依赖
│   ├── .env                    # 当前本地配置（git 忽略，不上传）
│   ├── .env.production         # ★ 生产环境配置模板（已上传 git）
│   └── app/
│       ├── main.py             # FastAPI 入口
│       ├── api/routes/         # 已实现：auth, users, persons, approvals, notifications, dashboard, briefing, student
│       ├── models/             # 已实现：User, Person, ApprovalRequest, Notification, DailyBriefing, AuditLog,
│                              # StudentAccount, StudentSchedule, StudentLeave, StudentTask, StudentNotification, StudentAccessLog
│       ├── schemas/            # 已实现：auth, user, person, approval, common, validators, student系列schemas
│       ├── services/           # 已实现：auth, person, approval, notification, ai_briefing, ai_risk, audit, student系列services
│       └── core/              # config, database, security, types
│
├── ethereal-campus/            # 学生端 App v1（参考，不开发）
├── ethereal-campus-2/         # ★ 学生端 App v2（前后端已完成接入）
│   └── src/
│       ├── App.tsx
│       ├── types.ts            # TypeScript 接口定义
│       └── components/
│           ├── AuthScreen.tsx
│           ├── HomeScreen.tsx
│           ├── AcademicScreen.tsx
│           ├── NotificationsScreen.tsx
│           ├── LeaveScreen.tsx
│           ├── RecognitionScreen.tsx
│           └── SettingsScreen.tsx
│
└── ethereal-campus-2/src/components/layout/
    ├── TopBar.tsx
    └── BottomNav.tsx
```

---

## 三、当前状态总结

### 已完成（本地已验证）

| 检查项 | 结果 |
|--------|------|
| 管理端 Web 前端构建 | ✅ 成功（JS bundle 中 `/api/v1`，无 localhost 硬编码） |
| Google Fonts CORS | ✅ 已修复（改为本地字体包 `/fonts/...woff2`） |
| 字体文件 | ✅ 已在 `public/fonts/` 目录 |
| 前端 Dockerfile | ✅ 正确（`frontend.Dockerfile`，context 为 `.`） |
| 后端 Dockerfile | ✅ 存在（`backend/Dockerfile`） |
| nginx.conf | ✅ 正确（静态服务 + `/api/` 反向代理） |
| docker-compose.yml | ✅ 正确（frontend + backend + db 整体编排） |
| .env.production | ✅ 存在（不含敏感信息，可上传 git） |
| deploy.sh | ✅ 存在（一键部署脚本） |

### 本地验证结果（关键）

```
✅ JS bundle 中 API 路径: /api/v1
✅ JS bundle 中无 localhost/127.0.0.1 硬编码
✅ CSS 中无 Google Fonts CDN 引用
✅ CSS 字体使用本地路径: url(/fonts/UcC73Fwr...woff2)
✅ CSS 字体使用本地路径: url(/fonts/xn7gYHE...woff2)
```

---

## 四、第一阶段任务：服务器部署（立即执行）

**目标**：将管理端 Web + FastAPI 后端 + PostgreSQL 部署到服务器，确保和本地一模一样。

### 4.1 部署步骤

#### 步骤 1：拉取代码

```bash
mkdir -p /opt && cd /opt
git clone https://github.com/ShawnYin-hub/smart-campus.git
cd smart-campus
```

#### 步骤 2：配置环境变量

```bash
# 复制生产配置模板
cp backend/.env.production backend/.env

# 编辑配置文件（必填两项）
nano backend/.env
```

在 nano 中修改以下两个必填项：

```
SECRET_KEY=<用下面命令生成的随机密钥>
DEEPSEEK_API_KEY=<你的 DeepSeek API Key>
```

生成随机密钥（退出 nano 后执行）：

```bash
openssl rand -hex 64
```

将输出的字符串粘贴到 `SECRET_KEY=` 后面。

DeepSeek API Key 从 https://platform.deepseek.com 获取。

保存退出 nano（Ctrl+X → Y → Enter）。

#### 步骤 3：构建并启动所有服务

> 首次构建需要 3-10 分钟，请耐心等待。

```bash
docker compose up -d --build
```

#### 步骤 4：等待服务就绪

```bash
docker compose ps
```

确认三个服务（`smart-campus-frontend`、`smart-campus-backend`、`smart-campus-db`）都是 `Up` 状态。

#### 步骤 5：验证后端健康

```bash
curl http://localhost:8000/api/v1/health
```

预期返回：

```json
{"status":"ok"}
```

#### 步骤 6：查看初始管理员密码

```bash
docker compose logs backend 2>&1 | grep "DEFAULT ADMIN ACCOUNT"
```

找到输出中的密码，记录下来。

#### 步骤 7：访问系统

| 服务 | 地址 |
|------|------|
| 前端界面 | `http://你的服务器IP:80`（或直接 `http://你的服务器IP`） |
| API 文档 | `http://你的服务器IP:8000/docs` |
| 数据库 | `localhost:5432` |

#### 步骤 8：首次登录

- 用户名：`admin`
- 密码：第 6 步查到的密码
- 登录后请立即修改密码

---

## 五、第二阶段任务：学生端后端开发（第一阶段完成后执行）

### 5.1 学生端 App v2 功能清单

学生端 `ethereal-campus-2/` 的 6 个页面功能如下：

#### AuthScreen（登录/注册）
- 输入：姓名 + 学号
- Tab 切换登录/注册
- 预期 API：`POST /api/v1/student/auth/login`、`POST /api/v1/student/auth/register`

#### HomeScreen（首页）
- 问候语 + 日期
- AI 动向卡片（`aiNotices`）
- 今日课表（`todaySchedule`）
- 任务概览（`tasks` 前 2 个 pending）
- 底部浮动 AI 助手
- 预期 API：`GET /api/v1/student/home`

#### AcademicScreen（学业看板）
- Tab 智慧课表：
  - AI OCR 识别课表截图 → `POST /api/v1/student/schedule/ocr`
  - 手动录入课程 → `POST /api/v1/student/schedule/add`
  - 当日课表展示 → `GET /api/v1/student/schedule/today`
- Tab 待办提醒：
  - 切换 pending/completed 筛选
  - 勾选完成 → `PATCH /api/v1/student/task/{id}/toggle`
  - AI 习惯摘要 + 高紧迫 URGENT 标签

#### NotificationsScreen（通知页面）
- 通知列表 → `GET /api/v1/student/notifications`
- 标记已读 → `PATCH /api/v1/student/notifications/{id}/read`
- 分类图标：school（学校）/ teacher（老师）/ homework（作业）
- 未读数 badge

#### LeaveScreen（请假服务）
- AI 语音解析请假 → `POST /api/v1/student/leave/voice-parse`（接收文本，LLM 提取信息）
- 手动填写请假表单 → `POST /api/v1/student/leave/apply`
- 历史记录 → `GET /api/v1/student/leave/history`
- 状态：pending / approved / rejected

#### RecognitionScreen（无感通行）
- 人脸录入 → `POST /api/v1/student/face/register`
- 通行历史 → `GET /api/v1/student/recognition/history`

#### SettingsScreen（设置中心）
- 个人信息 → `GET /api/v1/student/profile`
- 修改密码 → `POST /api/v1/student/password/change`
- 退出登录（清除本地 token）

### 5.2 后端 API 完整清单

路由前缀：`/api/v1/student/`

| HTTP | 端点 | 说明 |
|------|------|------|
| POST | `/student/auth/login` | 学生登录（学号+密码） |
| POST | `/student/auth/register` | 学生注册 |
| GET | `/student/auth/me` | 获取当前学生信息 |
| GET | `/student/home` | 首页汇总（aiNotices + tasks + notifications + todaySchedule） |
| GET | `/student/profile` | 学生档案 |
| POST | `/student/password/change` | 修改密码 |
| GET | `/student/schedule/today` | 获取当日课表 |
| POST | `/student/schedule/ocr` | OCR 识别课表图片（multipart/form-data） |
| POST | `/student/schedule/add` | 添加课程 |
| PATCH | `/student/task/{id}/toggle` | 切换任务完成状态 |
| GET | `/student/notifications` | 获取通知列表 |
| PATCH | `/student/notifications/{id}/read` | 标记通知已读 |
| GET | `/student/leave/history` | 请假历史 |
| POST | `/student/leave/apply` | 提交请假申请 |
| POST | `/student/leave/voice-parse` | 语音/文字解析请假信息 |
| POST | `/student/face/register` | 人脸照片上传 |
| GET | `/student/recognition/history` | 通行记录 |

### 5.3 数据模型（前端 TypeScript 定义）

```typescript
interface UserProfile {
  name: string;
  id: string;           // 学号
  avatarUrl: string;
}

interface SchoolInfo {
  name: string;
  logoUrl: string;
}

interface Course {
  id: string;
  name: string;
  time: string;        // "09:00 - 10:40"
  location: string;   // "教学楼 A101"
  type: 'science' | 'book' | 'math' | 'calculus';
}

interface Task {
  id: string;
  title: string;
  deadline: string;    // "明天 18:00"
  type: 'report' | 'reading';
  status: 'pending' | 'completed';   // v2 新增
  aiHabitSummary?: string;            // v2 新增：AI 建议
  urgencyLevel?: 'low' | 'medium' | 'high'; // v2 新增
}

interface AISummarizedNotice {       // v2 新增
  id: string;
  event: string;       // "物理实验课集合"
  time: string;        // "明天 14:00"
  location: string;    // "实验楼 302"
  originalText: string;
}

interface Notification {              // v2 新增
  id: string;
  sender: string;      // "教务处"
  content: string;
  time: string;
  type: 'homework' | 'school' | 'teacher';
  isRead: boolean;
}

interface RecognitionHistory {
  id: string;
  location: string;
  time: string;
  status: 'success' | 'leave';
  type: 'entry' | 'dining' | 'library';
}

interface LeaveRequest {
  id: string;
  type: string;       // '事假' | '病假' | '年假'
  dateRange: string;   // '2024-12-05 - 2024-12-06'
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
}

interface AppData {
  user: UserProfile;
  school: SchoolInfo;
  currentCourse?: Course;
  todaySchedule: Course[];
  tasks: Task[];
  notifications: Notification[];
  aiNotices: AISummarizedNotice[];
  leaveHistory: LeaveRequest[];
  recognitionHistory: RecognitionHistory[];
}
```

### 5.4 后端参考：管理端 Web 的接入规范

#### API 请求配置

```typescript
// ethereal-campus-2/src/services/api.config.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit & { isFormData?: boolean }
): Promise<T> {
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

#### JWT 认证（参考管理端）

- Token 存储在 `localStorage.setItem('student_token', token)`
- 请求头：`Authorization: Bearer <token>`
- Token 过期处理：参考管理端 `src/services/api.config.ts` 中的实现

### 5.5 技术规范

- **Python：** 3.12，FastAPI
- **数据库：** SQLAlchemy + SQLite（开发）/ PostgreSQL（生产）
- **AI：** DeepSeek API（参考 `backend/app/services/ai_briefing_service.py` 的调用方式）
- **认证：** JWT Bearer Token（与现有管理端风格完全一致）
- **图片上传：** FastAPI `UploadFile`，`multipart/form-data`
- **禁止使用：** Firebase、Supabase 等第三方后端

---

## 六、禁止事项

- ❌ 不要修改管理端 Web 的任何代码（`src/` 目录）
- ❌ 不要修改管理端后端已有路由（`backend/app/api/routes/`）
- ❌ 不要修改管理端后端已有 Model（`backend/app/models/`）
- ❌ 不要引入新数据库（全部复用现有 PostgreSQL）
- ❌ 不要在 git 中提交 `.env` 文件
- ❌ 不要修改 v1 代码（`ethereal-campus/`）

---

## 七、项目启动命令

```bash
# 后端（开发）
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 管理端 Web（开发）
cd ..
npm install
npm run dev
# → http://localhost:3000

# 学生端 App v2（开发）
cd ethereal-campus-2
npm install
npm run dev
# → http://localhost:5173（或其他端口）
```

---

## 八、部署后验证清单

| 检查项 | 方法 |
|--------|------|
| 前端界面正常打开 | `http://服务器IP` |
| API 文档可访问 | `http://服务器IP:8000/docs` |
| 管理端登录功能正常 | 使用 admin 账户登录 |
| API 健康检查通过 | `curl http://localhost:8000/api/v1/health` |
| 数据库连接正常 | `docker compose logs backend` 无 DB 报错 |
| 字体正常加载 | 浏览器 F12 检查无字体 CORS 错误 |
| 管理端功能正常 | 审批、人员管理、通知等页面可正常操作 |

