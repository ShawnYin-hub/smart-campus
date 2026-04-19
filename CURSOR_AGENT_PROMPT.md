# Cursor Agent Prompt — Ethereal Campus 学生端后端开发（v2）

---

## 一、项目概述

**项目名称：** BHSFIC 智慧校园管理系统 — 学生端（Ethereal Campus v2）

**GitHub 仓库：** `https://github.com/ShawnYin-hub/smart-campus.git`

**仓库结构（本次开发目标）：**

```
smart-campus/
├── ethereal-campus-2/       ← ★ 本次需要开发后端并接入的 App（v2）
│   └── src/
│       ├── App.tsx              ← 入口，含全局状态管理
│       ├── types.ts             ← TypeScript 接口定义
│       └── components/
│           ├── AuthScreen.tsx         ← 登录/注册
│           ├── HomeScreen.tsx         ← 首页（AI动向 + 日程 + 任务概览）
│           ├── AcademicScreen.tsx     ← 学业看板（课表OCR + 待办管理）
│           ├── NotificationsScreen.tsx← 原始通知列表
│           ├── LeaveScreen.tsx        ← 请假服务（语音+手动）
│           ├── RecognitionScreen.tsx  ← 人脸录入 + 通行历史
│           ├── SettingsScreen.tsx     ← 设置中心
│           ├── layout/
│           │   ├── TopBar.tsx         ← 顶部栏（通知铃铛可点击）
│           │   └── BottomNav.tsx      ← 底部导航（5个Tab）
│           └── ui/
│               └── Modal.tsx          ← 全局弹窗
├── ethereal-campus/        ← v1（参考，不修改）
├── backend/                ← 共享 FastAPI 后端（已为管理端实现部分API）
│   └── app/
│       ├── api/routes/     ← 已实现: auth, users, persons, approvals, notifications, dashboard, briefing
│       ├── models/          ← 已实现: User, Person, ApprovalRequest, Notification, DailyBriefing, AuditLog
│       ├── schemas/         ← 已实现: auth, user, person, approval, common, validators
│       ├── services/        ← 已实现: auth, person, approval, notification, ai_briefing, ai_risk, audit
│       ├── core/            ← config, database, security, types
│       └── main.py          ← FastAPI 入口
└── src/                    ← 管理端 Web（已完成，不修改）
```

---

## 二、v2 与 v1 的主要差异（重点）

### 2.1 导航结构变化

v1 的 `ScheduleScreen` 已合并到 `AcademicScreen`，并新增通知独立页面：

| v1 Tab | v2 Tab |
|--------|--------|
| 首页 | 首页 |
| 课表（ScheduleScreen） | **学业（AcademicScreen）** — 课表+待办合并 |
| 服务 | 服务（不变） |
| 识别 | 识别（不变） |
| 设置 | 设置（不变） |
| — | **通知（NotificationsScreen）** — 新增独立页面 |

BottomNav `Screen` 类型：
```typescript
export type Screen = 'home' | 'academic' | 'services' | 'recognition' | 'settings' | 'notifications';
```

### 2.2 TopBar 新增通知点击

```typescript
// TopBar 现在有 onNotifyClick 回调
<TopBar school={appData.school} onNotifyClick={() => setActiveScreen('notifications')} />
```

铃铛图标右上角有小红点（未读数），点击跳转 NotificationsScreen。

### 2.3 首页重构（HomeScreen）

v2 首页新增 **AI 动向卡片**（`aiNotices`），来自通知智能摘要：

```typescript
interface AISummarizedNotice {
  id: string;
  event: string;        // "物理实验课集合"
  time: string;         // "明天 14:00"
  location: string;     // "实验楼 302"
  originalText: string; // 原始通知内容
}
```

当 `aiNotices.length > 0` 时，顶部展示 AI 提炼的主动推送卡片；无动向时走常规视图。

### 2.4 学业看板（AcademicScreen）

v1 的 ScheduleScreen 整合进来，增加了 **待办管理**：

Tab 切换：智慧课表 / 待办提醒

**待办任务（Task）新增字段：**

```typescript
interface Task {
  id: string;
  title: string;
  deadline: string;
  type: 'report' | 'reading';
  status: 'pending' | 'completed';     // ← 新增
  aiHabitSummary?: string;              // ← 新增：AI 习惯建议
  urgencyLevel?: 'low' | 'medium' | 'high'; // ← 新增
}
```

支持：切换 pending/completed 筛选、勾选完成（`onToggleTask`）、高紧迫任务显示 URGENT 标签、AI 习惯摘要气泡。

### 2.5 通知页面（NotificationsScreen）

新增独立通知页面，展示原始通知列表：

```typescript
interface Notification {
  id: string;
  sender: string;        // "教务处" | "张老师 (物理)" | "智能助手"
  content: string;       // 通知正文
  time: string;         // "10:30"
  type: 'homework' | 'school' | 'teacher';  // 图标样式
  isRead: boolean;      // 是否已读
}
```

支持：已读/未读状态、未读小红点、分类图标、底部"处理"按钮。

---

## 三、学生端 v2 完整功能清单

### 3.1 AuthScreen（登录/注册）
- 输入：姓名 + 学号
- 登录/注册 Tab 切换
- 预期 API：POST `/api/v1/student/auth/login`、POST `/api/v1/student/auth/register`

### 3.2 HomeScreen（首页）
- 顶部问候语 + 日期
- AI 动向卡片（来自 `aiNotices`）
- 当前课程卡片（`currentCourse`，可选）
- 今日日程列表
- 任务概览（显示前2个 pending 任务）
- 底部浮动 AI 助手输入框
- 预期 API：GET `/api/v1/student/home`

### 3.3 AcademicScreen（学业看板）
- Tab 智慧课表：
  - AI OCR 识别上传（POST `/api/v1/student/schedule/ocr`）
  - 识别预览 + 批量导入
  - 手动录入课程表单（POST `/api/v1/student/schedule/add`）
  - 当日课表展示（GET `/api/v1/student/schedule/today`）
- Tab 待办提醒：
  - 切换 pending/completed 筛选
  - 勾选完成（PATCH `/api/v1/student/task/{id}/toggle`）
  - AI 习惯摘要展示
  - 高紧迫任务 URGENT 标签

### 3.4 NotificationsScreen（原始通知）
- GET `/api/v1/student/notifications` — 获取通知列表
- PATCH `/api/v1/student/notifications/{id}/read` — 标记已读
- 未读数显示（顶部 badge）
- 分类图标：school（学校）、teacher（老师）、homework（作业）

### 3.5 LeaveScreen（请假服务）
- AI 语音模拟（POST `/api/v1/student/leave/voice-parse` — 接收文字描述，LLM 提取请假信息）
- 手动填写表单（POST `/api/v1/student/leave/apply`）
- 历史请假记录（GET `/api/v1/student/leave/history`）
- 状态显示：pending（待审核）、approved（已批准）、rejected（已驳回）

### 3.6 RecognitionScreen（无感通行）
- 人脸录入（POST `/api/v1/student/face/register` — 现场拍摄或本地导入）
- 通行历史（GET `/api/v1/student/recognition/history`）
- 类型图标：entry（进门）、dining（食堂）、library（图书馆）

### 3.7 SettingsScreen（设置中心）
- 个人信息展示（GET `/api/v1/student/profile`）
- 修改密码（POST `/api/v1/student/password/change`）
- 多语言切换（前端本地处理，不涉及后端）
- 退出登录（清除本地 token）

---

## 四、数据模型（v2 types.ts）

```typescript
// 已在 ethereal-campus-2/src/types.ts 中定义

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
  status: 'pending' | 'completed';   // ← v2 新增
  aiHabitSummary?: string;            // ← v2 新增：AI 建议
  urgencyLevel?: 'low' | 'medium' | 'high'; // ← v2 新增
}

interface AISummarizedNotice {       // ← v2 新增
  id: string;
  event: string;       // "物理实验课集合"
  time: string;        // "明天 14:00"
  location: string;    // "实验楼 302"
  originalText: string;
}

interface Notification {              // ← v2 新增独立页面
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
  tasks: Task[];                       // ← v2：upcomingTasks → tasks
  notifications: Notification[];         // ← v2 新增
  aiNotices: AISummarizedNotice[];      // ← v2 新增
  leaveHistory: LeaveRequest[];
  recognitionHistory: RecognitionHistory[];
}
```

---

## 五、后端 API 设计

### 5.1 路由前缀：`/api/v1/student/`

| HTTP | 端点 | 说明 |
|------|------|------|
| POST | `/student/auth/login` | 学生登录（学号+密码） |
| POST | `/student/auth/register` | 学生注册 |
| GET | `/student/auth/me` | 获取当前学生信息 |
| GET | `/student/home` | 首页汇总（aiNotices + tasks + notifications） |
| GET | `/student/profile` | 学生档案 |
| POST | `/student/password/change` | 修改密码 |
| GET | `/student/schedule/today` | 获取当日课表 |
| POST | `/student/schedule/ocr` | OCR 识别课表图片（multipart） |
| POST | `/student/schedule/add` | 添加课程 |
| PATCH | `/student/task/{id}/toggle` | 切换任务完成状态 ← **v2 新增** |
| GET | `/student/notifications` | 获取通知列表 ← **v2 新增** |
| PATCH | `/student/notifications/{id}/read` | 标记通知已读 ← **v2 新增** |
| GET | `/student/leave/history` | 请假历史 |
| POST | `/student/leave/apply` | 提交请假申请 |
| POST | `/student/leave/voice-parse` | 语音/文字解析请假信息 |
| POST | `/student/face/register` | 人脸照片上传 |
| GET | `/student/recognition/history` | 通行记录 |

### 5.2 新增数据模型（v2）

- `backend/app/models/student_task.py` — **v2 新增**：学生待办任务（Task），含 `status`、`urgencyLevel`、AI 习惯分析字段
- `backend/app/models/student_notification.py` — **v2 新增**：学生通知（Notification），含 `type`（school/teacher/homework）、`isRead`
- `backend/app/models/ai_notice.py` — **v2 新增**：AI 提炼通知（AISummarizedNotice），由 LLM 从原始通知生成主动推送
- 其余模型同 v1 Prompt（student_schedule.py、student_leave.py、student_face.py、student_access_log.py）

### 5.3 AI 功能（关键）

#### 首页 AI 动向（GET `/student/home`）
- 调用 LLM 对当日通知列表进行摘要，生成 `aiNotices[]`
- Prompt 示例：`"从以下通知中提取最值得学生关注的事项，格式为：事件名、时间、地点、原始文本"`
- 参考现有 `ai_briefing_service.py` 的 API 调用方式

#### 待办 AI 习惯分析（POST `/student/task/{id}/toggle`）
- 学生完成/恢复任务时，记录行为数据
- 根据历史数据生成 `aiHabitSummary`（如"建议提前2小时开始，根据您通常需要1.5小时完成"）
- 根据 deadline 距离和历史完成速度计算 `urgencyLevel`

#### OCR 识别（POST `/student/schedule/ocr`）
- 接收课表截图图片
- 调用多模态 LLM（Gemini/DeepSeek Vision）解析课程信息
- 返回：`Course[]`

#### 请假语音解析（POST `/student/leave/voice-parse`）
- 接收：`{ "text": "我明天感冒了，需要请假两天" }`
- 调用 LLM 提取：`{ type, startDate, endDate, reason }`

---

## 六、前端接入指南

### 6.1 新增 services 层

在 `ethereal-campus-2/src/services/` 下新建：

```
ethereal-campus-2/src/services/
├── api.config.ts           ← API 基础配置（Bearer token）
├── auth.service.ts         ← 登录/注册/登出
├── home.service.ts         ← 首页汇总（含 aiNotices）
├── academic.service.ts     ← 课表 OCR + 添加课程
├── task.service.ts         ← 待办管理（toggle、获取列表）← v2 新增
├── notification.service.ts ← 通知列表 + 标记已读 ← v2 新增
├── leave.service.ts        ← 请假申请 + 历史
└── student.service.ts      ← 档案/人脸
```

### 6.2 API 请求配置

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

### 6.3 App.tsx 接入要点

v2 App.tsx 中需要接入的关键位置：

```typescript
// 1. 首页数据加载（useEffect）
useEffect(() => {
  if (isLoggedIn) {
    fetchHomeData().then(data => {
      setAppData(prev => ({
        ...prev,
        tasks: data.tasks,
        notifications: data.notifications,
        aiNotices: data.aiNotices,
        todaySchedule: data.todaySchedule,
      }));
    });
  }
}, [isLoggedIn]);

// 2. 任务切换
const toggleTaskStatus = async (id: string) => {
  await toggleTask(id); // PATCH /student/task/{id}/toggle
  setAppData(prev => ({
    ...prev,
    tasks: prev.tasks.map(t => t.id === id ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } : t)
  }));
};

// 3. 通知铃铛点击（在 TopBar 中）
// <TopBar school={appData.school} onNotifyClick={() => setActiveScreen('notifications')} />

// 4. 退出登录
const handleLogout = () => {
  localStorage.removeItem('student_token');
  // ...清空状态
};
```

---

## 七、技术规范（与 v1 一致）

- **Python：** 3.12，FastAPI
- **数据库：** 复用现有 SQLAlchemy + SQLite（开发）/ PostgreSQL（生产）
- **AI：** DeepSeek / Gemini API（参考 `ai_briefing_service.py`）
- **认证：** JWT Bearer Token
- **图片上传：** FastAPI `UploadFile`，multipart/form-data
- **禁止使用：** Firebase、Supabase 等第三方后端

---

## 八、验收标准

1. ✅ 学生登录/注册 → 真实 JWT 认证
2. ✅ 首页工作台 → 真实获取 `todaySchedule` + `tasks` + `notifications` + `aiNotices`
3. ✅ AI 动向卡片 → 从通知列表经 LLM 摘要生成
4. ✅ 课表 OCR 识别 → 调用多模态 AI 解析真实图片
5. ✅ 课表手动添加 → 持久化到数据库
6. ✅ 待办任务切换完成状态 → PATCH API + 本地状态更新
7. ✅ 待办 AI 习惯摘要 → 根据行为数据生成
8. ✅ 通知列表 → 独立页面展示原始通知
9. ✅ 通知已读标记 → PATCH API + 顶部未读数实时更新
10. ✅ 请假申请提交 → 写入数据库
11. ✅ 请假语音解析 → 调用 LLM 提取信息
12. ✅ 人脸录入 → 上传图片
13. ✅ 通行记录读取 → 从数据库读取
14. ✅ 修改密码 → 真实更新
15. ✅ Settings 个人信息 → 真实读取

---

## 九、禁止事项

- ❌ 不要修改管理端 Web（`src/` 目录）
- ❌ 不要修改管理端后端已有路由（`backend/app/api/routes/`）
- ❌ 不要修改管理端后端已有 Model（`backend/app/models/`）
- ❌ 不要引入新数据库
- ❌ 不要在 git 中提交 `.env` 文件
- ❌ 不要修改 v1 代码（`ethereal-campus/`）

---

## 十、项目启动

```bash
# 后端
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 学生端 App v2
cd ethereal-campus-2
npm install
npm run dev
```
