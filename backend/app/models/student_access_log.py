"""
StudentAccessLog 模型 — 学生通行记录
类型（access_type）：entry / dining / library
状态（status）：success / leave
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.types import GUID, TZDateTime


class StudentAccessLog(Base):
    __tablename__ = "student_access_logs"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("student_accounts.id"), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(100), nullable=False)   # 校门口/食堂/图书馆
    access_time: Mapped[datetime] = mapped_column(TZDateTime(), default=lambda: datetime.now(timezone.utc))
    access_type: Mapped[str] = mapped_column(String(20), nullable=False, default="entry")  # entry/dining/library
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="success")  # success/leave

    def __repr__(self) -> str:
        return f"<StudentAccessLog {self.location} [{self.access_type}]>"
