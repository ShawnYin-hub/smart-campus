"""
StudentNotification 模型 — 学生通知
与管理员 Notification 表分离，专门服务学生端
通知类型（notification_type）：school / teacher / homework
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.types import GUID, TZDateTime


class StudentNotification(Base):
    __tablename__ = "student_notifications"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("student_accounts.id"), nullable=False, index=True)
    sender: Mapped[str] = mapped_column(String(100), nullable=False)   # "教务处"
    content: Mapped[str] = mapped_column(String(1000), nullable=False)
    notification_type: Mapped[str] = mapped_column(String(20), nullable=False, default="school")  # school/teacher/homework
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(TZDateTime(), default=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return f"<StudentNotification {self.sender} [{self.notification_type}]>"
