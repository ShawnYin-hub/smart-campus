"""
StudentSchedule 模型 — 学生课表
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.types import GUID, TZDateTime


class StudentSchedule(Base):
    __tablename__ = "student_schedules"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("student_accounts.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    time: Mapped[str] = mapped_column(String(50), nullable=False)       # "09:00 - 10:40"
    location: Mapped[str] = mapped_column(String(100), nullable=True)
    course_type: Mapped[str] = mapped_column(String(20), nullable=False, default="science")  # science/book/math/calculus
    created_at: Mapped[datetime] = mapped_column(TZDateTime(), default=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return f"<StudentSchedule {self.name} [{self.time}]>"
