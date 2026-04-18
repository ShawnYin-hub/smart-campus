"""
Approval management service (sync version).
"""
from __future__ import annotations
import uuid
from typing import Optional, List, Tuple
from datetime import datetime, timezone, date
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func, or_

from app.models.approval import ApprovalRequest
from app.models.person import Person
from app.schemas.approval import ApprovalCreate, ApprovalUpdate

import logging
logger = logging.getLogger(__name__)


def _safe_div(numerator: float, denominator: float, default: float = 0.0) -> float:
    return round(numerator / denominator * 100, 1) if denominator > 0 else default


class ApprovalService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, approval_id: uuid.UUID) -> Optional[ApprovalRequest]:
        return self.db.execute(
            select(ApprovalRequest)
            .options(selectinload(ApprovalRequest.person))
            .where(ApprovalRequest.id == approval_id)
        ).scalar_one_or_none()

    def list_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        risk_level: Optional[str] = None,
        person_id: Optional[str] = None,
    ) -> Tuple[List[ApprovalRequest], int]:
        query = (
            select(ApprovalRequest)
            .options(selectinload(ApprovalRequest.person))
        )

        if status:
            query = query.where(ApprovalRequest.status == status)
        if risk_level:
            query = query.where(ApprovalRequest.risk_level == risk_level)
        if person_id:
            query = query.where(ApprovalRequest.person_id == uuid.UUID(person_id))
        if search:
            pattern = f"%{search}%"
            query = query.join(Person).where(
                or_(
                    Person.name.ilike(pattern),
                    Person.student_id.ilike(pattern),
                    ApprovalRequest.reason.ilike(pattern),
                )
            )

        total = self.db.execute(
            select(func.count()).select_from(query.subquery())
        ).scalar() or 0

        query = (
            query
            .offset((page - 1) * page_size)
            .limit(page_size)
            .order_by(ApprovalRequest.alert.desc(), ApprovalRequest.created_at.desc())
        )
        items = list(self.db.execute(query).scalars().all())
        return items, total

    def create(
        self,
        data: ApprovalCreate,
        risk_level: str = "low",
        risk_reason: str = "",
        alert: bool = False,
    ) -> ApprovalRequest:
        approval = ApprovalRequest(
            person_id=uuid.UUID(data.person_id),
            type=data.type,
            start_time=data.start_time,
            end_time=data.end_time,
            reason=data.reason,
            risk_level=risk_level,
            risk_reason=risk_reason,
            alert=alert,
            status="pending",
        )
        self.db.add(approval)
        self.db.flush()
        self.db.refresh(approval)
        return approval

    def approve(
        self,
        approval_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        comment: Optional[str] = None,
    ) -> Optional[ApprovalRequest]:
        approval = self.get_by_id(approval_id)
        if approval is None or approval.status != "pending":
            logger.warning("Approval %s approve failed: already processed or not found", approval_id)
            return None
        approval.status = "approved"
        approval.reviewed_by = reviewer_id
        approval.reviewed_at = datetime.now(timezone.utc)
        approval.review_comment = comment
        self.db.flush()
        self.db.refresh(approval)
        logger.info("Approval %s approved by user %s", approval_id, reviewer_id)
        return approval

    def reject(
        self,
        approval_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        comment: Optional[str] = None,
    ) -> Optional[ApprovalRequest]:
        approval = self.get_by_id(approval_id)
        if approval is None or approval.status != "pending":
            logger.warning("Approval %s reject failed: already processed or not found", approval_id)
            return None
        approval.status = "rejected"
        approval.reviewed_by = reviewer_id
        approval.reviewed_at = datetime.now(timezone.utc)
        approval.review_comment = comment
        self.db.flush()
        self.db.refresh(approval)
        logger.info("Approval %s rejected by user %s", approval_id, reviewer_id)
        return approval

    def get_stats(self) -> dict:
        pending_count = self.db.execute(
            select(func.count(ApprovalRequest.id))
            .where(ApprovalRequest.status == "pending")
        ).scalar() or 0

        today = date.today()
        today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
        today_end = datetime.combine(today, datetime.max.time()).replace(tzinfo=timezone.utc)
        today_processed = self.db.execute(
            select(func.count(ApprovalRequest.id))
            .where(
                ApprovalRequest.status.in_(["approved", "rejected"]),
                ApprovalRequest.reviewed_at >= today_start,
                ApprovalRequest.reviewed_at <= today_end,
            )
        ).scalar() or 0

        total_approved = self.db.execute(
            select(func.count(ApprovalRequest.id))
            .where(ApprovalRequest.status == "approved")
        ).scalar() or 0
        total_processed = self.db.execute(
            select(func.count(ApprovalRequest.id))
            .where(ApprovalRequest.status.in_(["approved", "rejected"]))
        ).scalar() or 0

        compliance_rate = _safe_div(total_approved, total_processed)

        return {
            "pending_count": pending_count,
            "today_processed": today_processed,
            "yesterday_count": 0,
            "compliance_rate": compliance_rate,
        }
