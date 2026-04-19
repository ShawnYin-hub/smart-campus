"""
学生端 API 路由汇总
前缀: /api/v1/student（由 main.py 的 api_v1 mount 到 /api/v1）
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.student_auth import get_current_student, CurrentStudent
from app.services.student_auth_service import StudentAuthService
from app.services.student_schedule_service import StudentScheduleService
from app.services.student_leave_service import StudentLeaveService
from app.services.student_task_service import StudentTaskService
from app.services.student_notification_service import StudentNotificationService
from app.services.student_home_service import StudentHomeService
from app.models import StudentAccount
from app.schemas import (
    StudentLoginRequest, StudentRegisterRequest, StudentLoginResponse,
    StudentProfileResponse, ChangePasswordRequest,
    CourseCreate, CourseResponse,
    LeaveApplyRequest, LeaveRequestResponse, VoiceParseRequest, VoiceParseResponse,
    TaskResponse, NotificationResponse, StudentHomeResponse, AISummarizedNotice,
)
from app.core.config import settings

router = APIRouter(prefix="/student", tags=["学生端"])


# ============================================================
# 依赖：获取当前学生账号
# ============================================================
def _get_account_id(student: CurrentStudent) -> uuid.UUID:
    return uuid.UUID(student.id)


# ============================================================
# 认证相关
# ============================================================
@router.post("/auth/register", response_model=StudentLoginResponse)
async def register(req: StudentRegisterRequest, db: Session = Depends(get_db)):
    """学生注册"""
    svc = StudentAuthService(db)
    try:
        account, token = svc.register(req.student_id, req.name, req.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return StudentLoginResponse(
        access_token=token,
        student_id=account.student_id,
        name=account.name,
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={account.name}",
    )


@router.post("/auth/login", response_model=StudentLoginResponse)
async def login(req: StudentLoginRequest, db: Session = Depends(get_db)):
    """学生登录"""
    svc = StudentAuthService(db)
    try:
        account, token = svc.login(req.student_id, req.password)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="学号或密码错误",
        )
    return StudentLoginResponse(
        access_token=token,
        student_id=account.student_id,
        name=account.name,
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={account.name}",
    )


@router.get("/auth/me", response_model=StudentProfileResponse)
async def get_profile(student: CurrentStudent = Depends(get_current_student)):
    """获取当前学生信息"""
    return StudentProfileResponse(
        student_id=student.student_id,
        name=student.name,
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={student.name}",
    )


@router.post("/auth/password")
async def change_password(
    req: ChangePasswordRequest,
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """修改密码"""
    svc = StudentAuthService(db)
    try:
        svc.change_password(uuid.UUID(student.id), req.old_password, req.new_password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return {"message": "密码修改成功"}


# ============================================================
# 首页
# ============================================================
@router.get("/home", response_model=StudentHomeResponse)
async def get_home(
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """获取首页汇总数据（课表+任务+通知+AI动向）"""
    svc = StudentHomeService(db)
    account_uuid = _get_account_id(student)
    data = svc.get_home_data(account_uuid)

    def fmt_schedule(s):
        return CourseResponse(
            id=str(s.id),
            name=s.name,
            time=s.time,
            location=s.location or "",
            type=s.course_type,
        )

    def fmt_task(t):
        return TaskResponse(
            id=str(t.id),
            title=t.title,
            deadline=t.deadline,
            type=t.task_type,
            status=t.status,
            aiHabitSummary=t.ai_habit_summary,
            urgencyLevel=t.urgency_level,
        )

    def fmt_notif(n):
        return NotificationResponse(
            id=str(n.id),
            sender=n.sender,
            content=n.content,
            time=n.created_at.strftime("%H:%M") if n.created_at else "",
            type=n.notification_type,
            isRead=n.is_read,
        )

    def fmt_ai(n):
        return AISummarizedNotice(
            id=n["id"],
            event=n["event"],
            time=n["time"],
            location=n["location"],
            originalText=n["originalText"],
        )

    return StudentHomeResponse(
        student_id=student.student_id,
        name=student.name,
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={student.name}",
        today_schedule=[fmt_schedule(s) for s in data["today_schedule"]],
        tasks=[fmt_task(t) for t in data["tasks"]],
        notifications=[fmt_notif(n) for n in data["notifications"]],
        ai_notices=[fmt_ai(a) for a in data["ai_notices"]],
    )


# ============================================================
# 课表
# ============================================================
@router.get("/schedule", response_model=list[CourseResponse])
async def get_schedule(
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """获取个人课表"""
    svc = StudentScheduleService(db)
    account_uuid = _get_account_id(student)
    courses = svc.get_today(account_uuid)
    return [
        CourseResponse(
            id=str(c.id),
            name=c.name,
            time=c.time,
            location=c.location or "",
            type=c.course_type,
        )
        for c in courses
    ]


@router.post("/schedule", response_model=CourseResponse)
async def add_course(
    req: CourseCreate,
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """添加课程"""
    svc = StudentScheduleService(db)
    account_uuid = _get_account_id(student)
    course = svc.add(
        account_uuid,
        req.name,
        req.time,
        req.location,
        req.course_type,
    )
    return CourseResponse(
        id=str(course.id),
        name=course.name,
        time=course.time,
        location=course.location or "",
        type=course.course_type,
    )


@router.delete("/schedule/{course_id}")
async def delete_course(
    course_id: str,
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """删除课程"""
    svc = StudentScheduleService(db)
    account_uuid = _get_account_id(student)
    try:
        ok = svc.delete(uuid.UUID(course_id), account_uuid)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的课程ID")
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="课程不存在或无权删除")
    return {"message": "删除成功"}


@router.post("/schedule/ocr", response_model=list[CourseResponse])
async def ocr_schedule(
    file: UploadFile = File(...),
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    AI 课表 OCR 识别（模拟）
    接收课表截图，返回识别后的课程列表（供前端确认后再导入）
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="请上传图片文件")

    # 模拟 AI OCR 解析（实际可接入 Gemini / DeepSeek Vision）
    svc = StudentScheduleService(db)
    account_uuid = _get_account_id(student)

    # 直接添加两条模拟课程（实际由 AI 解析图片返回）
    mock_courses = [
        svc.add(account_uuid, "大学物理", "14:00 - 15:40", "实验楼 302", "science"),
        svc.add(account_uuid, "近代史纲要", "16:00 - 17:40", "教学楼 A101", "book"),
    ]

    return [
        CourseResponse(
            id=str(c.id),
            name=c.name,
            time=c.time,
            location=c.location or "",
            type=c.course_type,
        )
        for c in mock_courses
    ]


# ============================================================
# 请假
# ============================================================
@router.get("/leave", response_model=list[LeaveRequestResponse])
async def get_leave_history(
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """获取请假历史"""
    svc = StudentLeaveService(db)
    account_uuid = _get_account_id(student)
    leaves = svc.get_history(account_uuid)
    return [
        LeaveRequestResponse(
            id=str(l.id),
            type=l.leave_type,
            dateRange=l.date_range,
            reason=l.reason or "",
            status=l.status,
        )
        for l in leaves
    ]


@router.post("/leave", response_model=LeaveRequestResponse)
async def apply_leave(
    req: LeaveApplyRequest,
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """提交请假申请"""
    svc = StudentLeaveService(db)
    account_uuid = _get_account_id(student)
    leave = svc.apply(account_uuid, req.leave_type, req.date_range, req.reason)
    return LeaveRequestResponse(
        id=str(leave.id),
        type=leave.leave_type,
        dateRange=leave.date_range,
        reason=leave.reason or "",
        status=leave.status,
    )


@router.post("/leave/voice-parse", response_model=VoiceParseResponse)
async def voice_parse(req: VoiceParseRequest):
    """
    AI 语音语义解析（模拟）
    将自然语言请假描述解析为结构化请假信息
    """
    text = req.text
    # 简单关键词解析（实际可接入 DeepSeek LLM）
    leave_type = "事假"
    reason = text
    date_range = "待定"

    keywords = {
        "感冒": ("病假", "身体不适"),
        "发烧": ("病假", "发烧"),
        "家中有事": ("事假", "家中有事"),
        "爷爷": ("事假", "家庭事务"),
        "奶奶": ("事假", "家庭事务"),
    }
    for kw, (t, r) in keywords.items():
        if kw in text:
            leave_type = t
            reason = r
            break

    return VoiceParseResponse(
        leave_type=leave_type,
        date_range=date_range,
        reason=reason,
    )


# ============================================================
# 任务
# ============================================================
@router.get("/tasks", response_model=list[TaskResponse])
async def get_tasks(
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """获取任务列表"""
    svc = StudentTaskService(db)
    account_uuid = _get_account_id(student)
    tasks = svc.get_all(account_uuid)
    return [
        TaskResponse(
            id=str(t.id),
            title=t.title,
            deadline=t.deadline,
            type=t.task_type,
            status=t.status,
            aiHabitSummary=t.ai_habit_summary,
            urgencyLevel=t.urgency_level,
        )
        for t in tasks
    ]


@router.patch("/tasks/{task_id}/toggle", response_model=TaskResponse)
async def toggle_task(
    task_id: str,
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """切换任务完成状态"""
    svc = StudentTaskService(db)
    account_uuid = _get_account_id(student)
    try:
        task = svc.toggle(uuid.UUID(task_id), account_uuid)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的任务ID")
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="任务不存在")
    return TaskResponse(
        id=str(task.id),
        title=task.title,
        deadline=task.deadline,
        type=task.task_type,
        status=task.status,
        aiHabitSummary=task.ai_habit_summary,
        urgencyLevel=task.urgency_level,
    )


# ============================================================
# 通知
# ============================================================
@router.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """获取通知列表"""
    svc = StudentNotificationService(db)
    account_uuid = _get_account_id(student)
    notifications = svc.get_all(account_uuid)
    return [
        NotificationResponse(
            id=str(n.id),
            sender=n.sender,
            content=n.content,
            time=n.created_at.strftime("%H:%M") if n.created_at else "",
            type=n.notification_type,
            isRead=n.is_read,
        )
        for n in notifications
    ]


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """标记通知为已读"""
    svc = StudentNotificationService(db)
    account_uuid = _get_account_id(student)
    try:
        notif = svc.mark_read(uuid.UUID(notification_id), account_uuid)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的通知ID")
    if notif is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="通知不存在")
    return {"message": "已标记为已读"}


# ============================================================
# 通行记录（人脸识别）
# ============================================================
@router.get("/recognition/history")
async def get_recognition_history(
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """获取通行历史"""
    # 从 student_access_logs 读取
    from app.models import StudentAccessLog
    logs = (
        db.query(StudentAccessLog)
        .filter(StudentAccessLog.student_id == uuid.UUID(student.id))
        .order_by(StudentAccessLog.access_time.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(log.id),
            "location": log.location,
            "time": log.access_time.strftime("%Y-%m-%d %H:%M") if log.access_time else "",
            "status": log.status,
            "type": log.access_type,
        }
        for log in logs
    ]


@router.post("/recognition/register")
async def register_face(
    student: CurrentStudent = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    人脸注册（占位）
    实际应接收图片，上传到 OSS，调用人脸识别服务
    """
    return {"message": "人脸注册功能（请上传图片）"}
