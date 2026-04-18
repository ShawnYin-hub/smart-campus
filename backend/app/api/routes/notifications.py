"""
通知管理路由（同步版本）
支持查看通知列表、未读数、标记已读、一键全部已读、删除。
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user, CurrentUser
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["通知管理"])


@router.get("/unread-count", summary="获取未读通知数量")
def get_unread_count(
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    count = NotificationService(db).get_unread_count(uuid.UUID(current_user.id))
    return {"unread_count": count}


@router.get("", summary="获取通知列表")
def list_notifications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    is_read: bool = Query(default=None),
    notification_type: str = Query(default=None),
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = NotificationService(db)
    items, total = service.list_paginated(
        user_id=uuid.UUID(current_user.id),
        page=page,
        page_size=page_size,
        is_read=is_read,
        notification_type=notification_type,
    )

    return {
        "items": [
            {
                "id": str(n.id),
                "notification_type": n.notification_type,
                "level": n.level,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "is_pinned": n.is_pinned,
                "related_resource_type": n.related_resource_type,
                "related_resource_id": str(n.related_resource_id) if n.related_resource_id else None,
                "extra_data": n.extra_data or {},
                "created_at": n.created_at,
                "read_at": n.read_at,
            }
            for n in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "unread_count": service.get_unread_count(uuid.UUID(current_user.id)),
    }


@router.post("/{notification_id}/read", summary="标记单条通知为已读")
def mark_read(
    notification_id: str,
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    notification = NotificationService(db).mark_read(
        notification_id=uuid.UUID(notification_id),
        user_id=uuid.UUID(current_user.id),
    )
    if notification is None:
        raise HTTPException(status_code=404, detail="通知不存在或无权操作")
    return {"message": "已标记为已读", "id": str(notification.id)}


@router.post("/read-all", summary="一键全部已读")
def mark_all_read(
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    count = NotificationService(db).mark_all_read(uuid.UUID(current_user.id))
    return {"message": f"已将 {count} 条通知标记为已读", "marked_count": count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT, summary="删除单条通知")
def delete_notification(
    notification_id: str,
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not NotificationService(db).delete(
        notification_id=uuid.UUID(notification_id),
        user_id=uuid.UUID(current_user.id),
    ):
        raise HTTPException(status_code=404, detail="通知不存在或无权操作")


@router.post("/delete-all-read", summary="清空所有已读通知")
def delete_all_read(
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    NotificationService(db).delete_all_read(uuid.UUID(current_user.id))
    return {"message": "已清空所有已读通知"}


# --- 告警快捷路由（与 dashboard/alerts 相同数据，但走通知体系）---

@router.get("/alerts", summary="获取紧急告警列表")
def get_alerts(
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """获取紧急告警（未读的 error 级别通知）"""
    from sqlalchemy import select
    from app.models.notification import Notification

    items, _ = NotificationService(db).list_paginated(
        user_id=uuid.UUID(current_user.id),
        page=1,
        page_size=20,
        notification_type="alert_high_risk",
    )
    return {
        "items": [
            {
                "id": str(n.id),
                "notification_type": n.notification_type,
                "level": n.level,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "related_resource_type": n.related_resource_type,
                "related_resource_id": str(n.related_resource_id) if n.related_resource_id else None,
                "extra_data": n.extra_data or {},
                "created_at": n.created_at,
            }
            for n in items
        ],
        "total": len(items),
    }
