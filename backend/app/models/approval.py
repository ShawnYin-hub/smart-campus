"""
ApprovalRequest 模型 — 审批请求
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.types import GUID, TZDateTime


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    person_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("persons.id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(30), nullable=False, default="leave_school")
    start_time: Mapped[datetime] = mapped_column(TZDateTime(), nullable=True)
    end_time: Mapped[datetime] = mapped_column(TZDateTime(), nullable=True)
    reason: Mapped[str] = mapped_column(String(1000), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(10), nullable=True, default="low")
    risk_reason: Mapped[str] = mapped_column(String(500), nullable=True)
    alert: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    reviewed_by: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(TZDateTime(), nullable=True)
    review_comment: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TZDateTime(), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(TZDateTime(), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    person: Mapped["Person"] = relationship("Person", back_populates="approval_requests", foreign_keys=[person_id])
    reviewer: Mapped["User"] = relationship("User", back_populates="approvals", foreign_keys=[reviewed_by])

    def __repr__(self) -> str:
        return f"<ApprovalRequest {self.id} [{self.status}]>"
