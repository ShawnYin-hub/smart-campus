"""
StudentAccount 模型 — 学生登录账号
与 User（管理员）分离，学生使用学号+密码登录
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.types import GUID, TZDateTime


class StudentAccount(Base):
    __tablename__ = "student_accounts"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        TZDateTime(), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<StudentAccount {self.student_id} [{self.name}]>"
