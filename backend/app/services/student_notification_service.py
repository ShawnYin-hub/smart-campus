"""
学生通知服务
"""
import uuid
from sqlalchemy.orm import Session

from app.models import StudentNotification


class StudentNotificationService:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, student_id: uuid.UUID) -> list[StudentNotification]:
        """获取所有通知（最新的在前）"""
        return (
            self.db.query(StudentNotification)
            .filter(StudentNotification.student_id == student_id)
            .order_by(StudentNotification.created_at.desc())
            .all()
        )

    def mark_read(self, notification_id: uuid.UUID, student_id: uuid.UUID) -> StudentNotification | None:
        """标记通知为已读（只能标记自己的）"""
        notif = (
            self.db.query(StudentNotification)
            .filter(
                StudentNotification.id == notification_id,
                StudentNotification.student_id == student_id,
            )
            .first()
        )
        if notif is None:
            return None
        notif.is_read = True
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def get_unread_count(self, student_id: uuid.UUID) -> int:
        return (
            self.db.query(StudentNotification)
            .filter(
                StudentNotification.student_id == student_id,
                StudentNotification.is_read == False,
            )
            .count()
        )
