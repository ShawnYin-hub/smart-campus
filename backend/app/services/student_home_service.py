"""
学生首页汇总服务
整合课表、任务、通知、AI动向，为首页提供一站式数据
"""
import uuid
from sqlalchemy.orm import Session

from app.models import StudentNotification
from app.services.student_schedule_service import StudentScheduleService
from app.services.student_task_service import StudentTaskService
from app.services.student_notification_service import StudentNotificationService


class StudentHomeService:
    def __init__(self, db: Session):
        self.db = db
        self.schedule_svc = StudentScheduleService(db)
        self.task_svc = StudentTaskService(db)
        self.notif_svc = StudentNotificationService(db)

    def get_home_data(self, student_id: uuid.UUID) -> dict:
        today_schedule = self.schedule_svc.get_today(student_id)
        tasks = self.task_svc.get_all(student_id)
        notifications = self.notif_svc.get_all(student_id)

        # AI 动向：从通知中提炼关键信息（简化版：直接取前3条未读通知作为AI动向）
        ai_notices = []
        unread = [n for n in notifications if not n.is_read]
        for n in unread[:3]:
            ai_notices.append({
                "id": str(n.id),
                "event": n.sender,
                "time": self._format_time(n.created_at),
                "location": "待定",
                "originalText": n.content,
            })

        return {
            "today_schedule": today_schedule,
            "tasks": tasks,
            "notifications": notifications,
            "ai_notices": ai_notices,
        }

    def _format_time(self, dt) -> str:
        if dt is None:
            return ""
        return dt.strftime("%H:%M")
