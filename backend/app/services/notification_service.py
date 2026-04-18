"""
通知管理服务（同步版本）
支持创建通知、标记已读、统计未读数、查询列表。
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_

from app.models.notification import Notification


class NotificationService:
    """通知管理服务"""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        user_id: uuid.UUID,
        notification_type: str,
        title: str,
        level: str = "info",
        message: Optional[str] = None,
        related_resource_type: Optional[str] = None,
        related_resource_id: Optional[uuid.UUID] = None,
        extra_data: Optional[dict] = None,
        is_pinned: bool = False,
        expires_at: Optional[datetime] = None,
    ) -> Notification:
        """创建一条通知"""
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            level=level,
            related_resource_type=related_resource_type,
            related_resource_id=related_resource_id,
            extra_data=extra_data or {},
            is_pinned=is_pinned,
            is_read=False,
            expires_at=expires_at,
        )
        self.db.add(notification)
        self.db.flush()
        self.db.refresh(notification)
        return notification

    def get_unread_count(self, user_id: uuid.UUID) -> int:
        """获取用户未读通知数量"""
        return self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
                or_(Notification.expires_at.is_(None), Notification.expires_at > datetime.now(timezone.utc)),
            )
        ).scalar() or 0

    def list_paginated(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        is_read: Optional[bool] = None,
        notification_type: Optional[str] = None,
    ) -> Tuple[List[Notification], int]:
        """分页查询通知列表"""
        query = select(Notification).where(
            Notification.user_id == user_id,
            or_(
                Notification.expires_at.is_(None),
                Notification.expires_at > datetime.now(timezone.utc),
            ),
        )

        if is_read is not None:
            query = query.where(Notification.is_read == is_read)
        if notification_type:
            query = query.where(Notification.notification_type == notification_type)

        total = self.db.execute(
            select(func.count()).select_from(query.subquery())
        ).scalar() or 0

        query = (
            query.order_by(
                Notification.is_pinned.desc(),
                Notification.created_at.desc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(self.db.execute(query).scalars().all())
        return items, total

    def mark_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
        """标记单条通知为已读（仅限本人）"""
        notification = self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        ).scalar_one_or_none()
        if notification is None:
            return None
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        self.db.flush()
        self.db.refresh(notification)
        return notification

    def mark_all_read(self, user_id: uuid.UUID) -> int:
        """一键全部已读，返回已标记数量"""
        result = self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        ).scalar() or 0

        self.db.execute(
            Notification.__table__.update()
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
            .values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        self.db.flush()
        return result

    def delete(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """删除通知（仅限本人）"""
        notification = self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        ).scalar_one_or_none()
        if notification is None:
            return False
        self.db.delete(notification)
        self.db.flush()
        return True

    def delete_all_read(self, user_id: uuid.UUID) -> int:
        """删除所有已读通知"""
        self.db.execute(
            Notification.__table__.delete().where(
                Notification.user_id == user_id,
                Notification.is_read == True,
            )
        )
        self.db.flush()
        return 0
