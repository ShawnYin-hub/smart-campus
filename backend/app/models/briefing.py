"""
DailyBriefing 模型 — AI 晨报
"""
import uuid
from datetime import datetime, timezone, date
from sqlalchemy import String, Date, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.types import GUID, TZDateTime


class DailyBriefing(Base):
    __tablename__ = "daily_briefings"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=True)
    content: Mapped[str] = mapped_column(String(5000), nullable=False)
    tags: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    date: Mapped[date] = mapped_column(Date, unique=True, nullable=False, index=True)
    generated_by: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TZDateTime(), default=lambda: datetime.now(timezone.utc))

    generator: Mapped["User"] = relationship("User", back_populates="briefings")

    def __repr__(self) -> str:
        return f"<DailyBriefing {self.date}: {self.title}>"
