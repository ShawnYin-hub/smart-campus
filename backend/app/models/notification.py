"""
Notification 模型 — 通知/消息记录
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.types import GUID, TZDateTime


class Notification(Base):
    """
    通知消息表

    支持的通知类型（notification_type）：
      - approval_request  : 有新的审批申请（给管理员）
      - approval_approved : 审批已通过（给申请人）
      - approval_rejected : 审批被拒绝（给申请人）
      - alert_high_risk  : 高风险告警（给管理员）
      - system            : 系统通知（给所有人或指定人）

    支持的级别（level）：
      - info     : 普通信息（蓝色）
      - warning  : 警告（黄色）
      - error    : 紧急/错误（红色）
    """

    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    # 通知接收人（哪个用户看到这条通知）
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    # 通知类型
    notification_type: Mapped[str] = mapped_column(String(30), nullable=False, default="system", index=True)
    # 通知级别（前端渲染颜色用）
    level: Mapped[str] = mapped_column(String(20), nullable=False, default="info")
    # 通知标题
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    # 通知正文内容
    message: Mapped[str] = mapped_column(String(1000), nullable=True)
    # 是否已读
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    # 是否置顶
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    # 关联资源类型（如 approval、person）
    related_resource_type: Mapped[str] = mapped_column(String(50), nullable=True)
    # 关联资源 ID
    related_resource_id: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=True)
    # 扩展数据（JSON）
    extra_data: Mapped[dict] = mapped_column(JSON, nullable=True, default=dict)
    # 过期时间（为空表示不过期）
    expires_at: Mapped[datetime] = mapped_column(TZDateTime(), nullable=True)
    # 阅读时间
    read_at: Mapped[datetime] = mapped_column(TZDateTime(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        TZDateTime(), default=lambda: datetime.now(timezone.utc), index=True
    )

    # 关联的用户
    user: Mapped["User"] = relationship("User", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification {self.id} [{self.level}] {self.title}>"
