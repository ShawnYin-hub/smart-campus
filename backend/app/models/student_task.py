"""
StudentTask 模型 — 学生任务/作业
状态：pending / completed
紧迫度：low / medium / high
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.types import GUID, TZDateTime


class StudentTask(Base):
    __tablename__ = "student_tasks"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("student_accounts.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    deadline: Mapped[str] = mapped_column(String(50), nullable=False)    # "明天 18:00"
    task_type: Mapped[str] = mapped_column(String(20), nullable=False, default="report")  # report/reading
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)  # pending/completed
    ai_habit_summary: Mapped[str] = mapped_column(String(500), nullable=True)
    urgency_level: Mapped[str] = mapped_column(String(10), nullable=True)  # low/medium/high
    created_at: Mapped[datetime] = mapped_column(TZDateTime(), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(TZDateTime(), nullable=True)

    def __repr__(self) -> str:
        return f"<StudentTask {self.title} [{self.status}]>"
