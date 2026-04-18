"""
审批路由（同步版本）
包含通知自动创建逻辑：
- 高风险申请创建 → 通知所有管理员/操作员
- 审批通过/拒绝 → 通知审批操作者（当前登录管理员）
"""
from __future__ import annotations
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_active_user, CurrentUser, UserRole
from app.services.approval_service import ApprovalService
from app.services.person_service import PersonService
from app.services.ai_risk_service import AIRiskService
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService
from app.schemas.approval import (
    ApprovalCreate, ApprovalResponse, ApprovalListResponse,
    ApprovalReviewRequest, ApprovalStatsResponse,
)
from app.models.user import User

router = APIRouter(prefix="/approvals", tags=["审批管理"])

APPROVAL_TYPE_DISPLAY = {
    "leave_school": "离校申请",
    "visitor": "访客申请",
    "other": "其他申请",
}


def _notify_admins_of_high_risk_approval(
    db: Session,
    approval_id: uuid.UUID,
    person_name: str,
    approval_type: str,
    risk_reason: str,
    requester_name: str,
):
    """高风险申请创建时，通知所有管理员/操作员"""
    admin_users = db.execute(
        select(User).where(User.role.in_(["admin", "operator"]), User.is_active == True)
    ).scalars().all()

    type_display = APPROVAL_TYPE_DISPLAY.get(approval_type, approval_type)

    title = f"【高风险】{type_display} - {requester_name}"
    message = f"申请人：{person_name}，风险原因：{risk_reason}，请尽快处理。"

    for admin_user in admin_users:
        NotificationService(db).create(
            user_id=admin_user.id,
            notification_type="alert_high_risk",
            title=title,
            message=message,
            level="error",
            related_resource_type="approval",
            related_resource_id=approval_id,
            extra_data={
                "approval_id": str(approval_id),
                "person_name": person_name,
                "approval_type": approval_type,
                "risk_reason": risk_reason,
            },
            is_pinned=True,
        )


def _notify_reviewer_self(
    db: Session,
    reviewer_id: uuid.UUID,
    approval_id: uuid.UUID,
    person_name: str,
    approval_type: str,
    action: str,
    comment: str | None,
):
    """给审批人发确认通知"""
    type_display = APPROVAL_TYPE_DISPLAY.get(approval_type, approval_type)
    action_text = "已通过" if action == "approved" else "已被拒绝"
    level = "info" if action == "approved" else "warning"

    NotificationService(db).create(
        user_id=reviewer_id,
        notification_type="approval_approved" if action == "approved" else "approval_rejected",
        title=f"您{action_text}了{person_name}的{type_display}",
        message=comment or f"申请已{action_text}。",
        level=level,
        related_resource_type="approval",
        related_resource_id=approval_id,
    )


def _notify_applicant(
    db: Session,
    applicant_user_id: uuid.UUID,
    approval_id: uuid.UUID,
    person_name: str,
    approval_type: str,
    action: str,
    reviewer_name: str,
    comment: str | None,
):
    """通知申请人"""
    type_display = APPROVAL_TYPE_DISPLAY.get(approval_type, approval_type)
    action_text = "已通过" if action == "approved" else "已被拒绝"
    level = "info" if action == "approved" else "warning"

    NotificationService(db).create(
        user_id=applicant_user_id,
        notification_type="approval_approved" if action == "approved" else "approval_rejected",
        title=f"您的{type_display}：{action_text}",
        message=f"{reviewer_name}老师{'审核通过了' if action == 'approved' else '拒绝了'}您的申请" +
                (f"，备注：{comment}" if comment else "。"),
        level=level,
        related_resource_type="approval",
        related_resource_id=approval_id,
    )


def _build_approval_response(approval, person=None) -> dict:
    """统一构建审批响应字典"""
    return {
        "id": str(approval.id),
        "person_id": str(approval.person_id),
        "person": (
            {"id": str(person.id), "name": person.name, "student_id": person.student_id}
            if person
            else None
        ),
        "type": approval.type,
        "start_time": approval.start_time,
        "end_time": approval.end_time,
        "reason": approval.reason,
        "risk_level": approval.risk_level,
        "risk_reason": approval.risk_reason,
        "alert": approval.alert,
        "status": approval.status,
        "reviewed_by": str(approval.reviewed_by) if approval.reviewed_by else None,
        "reviewed_at": approval.reviewed_at,
        "review_comment": approval.review_comment,
        "created_at": approval.created_at,
        "updated_at": approval.updated_at,
    }


# --- 路由实现 ---

@router.get("/stats", response_model=ApprovalStatsResponse, summary="获取审批统计")
def get_stats(
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return ApprovalService(db).get_stats()


@router.get("", response_model=ApprovalListResponse, summary="获取审批列表")
def list_approvals(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: str = Query(default=None),
    risk_level: str = Query(default=None),
    search: str = Query(default=None),
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = ApprovalService(db)
    items, total = service.list_paginated(page, page_size, search, status, risk_level)
    return {
        "items": [_build_approval_response(a, getattr(a, "person", None)) for a in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("", response_model=ApprovalResponse, status_code=status.HTTP_201_CREATED, summary="提交审批申请")
def create_approval(
    request: Request,
    data: ApprovalCreate,
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    person_service = PersonService(db)
    person = person_service.get_by_id(uuid.UUID(data.person_id))
    if person is None:
        raise HTTPException(status_code=404, detail="申请人档案不存在")

    # AI 风控评估（同步，会阻塞 worker，但保证数据一致性）
    ai_service = AIRiskService()
    risk_result = ai_service.assess_sync(
        name=person.name,
        student_id=person.student_id,
        approval_type=data.type,
        start_time=data.start_time.isoformat() if data.start_time else None,
        end_time=data.end_time.isoformat() if data.end_time else None,
        reason=data.reason,
    )

    approval_service = ApprovalService(db)
    approval = approval_service.create(
        data=data,
        risk_level=risk_result.risk_level,
        risk_reason=risk_result.risk_reason,
        alert=risk_result.alert,
    )

    # 高风险申请 → 通知所有管理员
    if risk_result.alert:
        _notify_admins_of_high_risk_approval(
            db=db,
            approval_id=approval.id,
            person_name=person.name,
            approval_type=data.type,
            risk_reason=risk_result.risk_reason,
            requester_name=person.name,
        )

    AuditService.log_sync(
        db=db,
        user_id=uuid.UUID(current_user.id),
        action="create_approval",
        resource_type="approval",
        resource_id=approval.id,
        detail={
            "person_id": data.person_id,
            "type": data.type,
            "risk_level": risk_result.risk_level,
            "alert": risk_result.alert,
        },
        ip_address=request.client.host if request.client else None,
    )

    return _build_approval_response(approval, person)


@router.get("/{approval_id}", response_model=ApprovalResponse, summary="获取审批详情")
def get_approval(
    approval_id: str,
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    approval = ApprovalService(db).get_by_id(uuid.UUID(approval_id))
    if approval is None:
        raise HTTPException(status_code=404, detail="审批记录不存在")
    person = PersonService(db).get_by_id(approval.person_id) if approval.person_id else None
    return _build_approval_response(approval, person)


@router.post("/{approval_id}/approve", response_model=ApprovalResponse, summary="审批通过")
def approve_approval(
    request: Request,
    approval_id: str,
    data: ApprovalReviewRequest = None,
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not current_user.can_manage_approvals:
        raise HTTPException(status_code=403, detail="您没有审批权限")

    approval_service = ApprovalService(db)
    approval = approval_service.approve(
        uuid.UUID(approval_id),
        uuid.UUID(current_user.id),
        data.comment if data else None,
    )
    if approval is None:
        raise HTTPException(status_code=400, detail="该申请已处理或不存在")

    # 获取申请人信息
    person = PersonService(db).get_by_id(approval.person_id)
    person_name = person.name if person else "未知人员"

    # 幂等通知：避免重复通知
    _notify_reviewer_self(
        db=db,
        reviewer_id=uuid.UUID(current_user.id),
        approval_id=approval.id,
        person_name=person_name,
        approval_type=approval.type,
        action="approved",
        comment=data.comment if data else None,
    )

    AuditService.log_sync(
        db=db,
        user_id=uuid.UUID(current_user.id),
        action="approve_approval",
        resource_type="approval",
        resource_id=uuid.UUID(approval_id),
        detail={"status": "approved", "comment": data.comment if data else None},
        ip_address=request.client.host if request.client else None,
    )

    return _build_approval_response(approval, person)


@router.post("/{approval_id}/reject", response_model=ApprovalResponse, summary="审批拒绝")
def reject_approval(
    request: Request,
    approval_id: str,
    data: ApprovalReviewRequest = None,
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not current_user.can_manage_approvals:
        raise HTTPException(status_code=403, detail="您没有审批权限")

    approval_service = ApprovalService(db)
    approval = approval_service.reject(
        uuid.UUID(approval_id),
        uuid.UUID(current_user.id),
        data.comment if data else None,
    )
    if approval is None:
        raise HTTPException(status_code=400, detail="该申请已处理或不存在")

    # 获取申请人信息
    person = PersonService(db).get_by_id(approval.person_id)
    person_name = person.name if person else "未知人员"

    # 幂等通知
    _notify_reviewer_self(
        db=db,
        reviewer_id=uuid.UUID(current_user.id),
        approval_id=approval.id,
        person_name=person_name,
        approval_type=approval.type,
        action="rejected",
        comment=data.comment if data else None,
    )

    AuditService.log_sync(
        db=db,
        user_id=uuid.UUID(current_user.id),
        action="reject_approval",
        resource_type="approval",
        resource_id=uuid.UUID(approval_id),
        detail={"status": "rejected", "comment": data.comment if data else None},
        ip_address=request.client.host if request.client else None,
    )

    return _build_approval_response(approval, person)
