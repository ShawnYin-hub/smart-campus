"""
Person 模型 — 师生档案
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.types import GUID, TZDateTime


class Person(Base):
    __tablename__ = "persons"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    dept: Mapped[str] = mapped_column(String(100), nullable=True)
    role_type: Mapped[str] = mapped_column(String(20), nullable=False, default="student")
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    id_card: Mapped[str] = mapped_column(String(20), nullable=True)
    face_registered: Mapped[bool] = mapped_column(Boolean, default=False)
    face_image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    device_id: Mapped[str] = mapped_column(String(50), nullable=True)
    device_bind_time: Mapped[datetime] = mapped_column(TZDateTime(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TZDateTime(), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(TZDateTime(), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    approval_requests: Mapped[list["ApprovalRequest"]] = relationship("ApprovalRequest", back_populates="person", foreign_keys="ApprovalRequest.person_id")

    def __repr__(self) -> str:
        return f"<Person {self.student_id} - {self.name}>"
