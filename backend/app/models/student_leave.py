"""
StudentLeave 模型 — 学生请假记录
请假状态：pending / approved / rejected
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.types import GUID, TZDateTime


class StudentLeave(Base):
    __tablename__ = "student_leaves"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("student_accounts.id"), nullable=False, index=True)
    leave_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 事假/病假/年假
    date_range: Mapped[str] = mapped_column(String(100), nullable=False)   # "2024-12-05 - 2024-12-06"
    reason: Mapped[str] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)  # pending/approved/rejected
    created_at: Mapped[datetime] = mapped_column(TZDateTime(), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(TZDateTime(), nullable=True)

    def __repr__(self) -> str:
        return f"<StudentLeave {self.leave_type} [{self.status}]>"
