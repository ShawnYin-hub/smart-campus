"""
AI 晨报路由（同步版本）
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_active_user, CurrentUser, require_role, UserRole
from app.models.briefing import DailyBriefing
from app.models.person import Person
from app.models.approval import ApprovalRequest
from app.services.ai_briefing_service import AIBriefingService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/briefing", tags=["AI 晨报"])


@router.get("/today", summary="获取今日晨报")
def get_today_briefing(
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    briefing = db.execute(
        select(DailyBriefing).where(DailyBriefing.date == today)
    ).scalar_one_or_none()

    if briefing is None:
        return {"id": None, "title": "AI 每日晨报",
                "content": "暂无今日简报数据，请联系管理员生成。",
                "tags": [], "date": str(today)}

    return {"id": str(briefing.id), "title": briefing.title, "content": briefing.content,
            "tags": briefing.tags or [], "date": str(briefing.date), "created_at": briefing.created_at}


@router.post("/generate", summary="手动触发 AI 生成晨报")
def generate_briefing(
    request: Request,
    current_user: CurrentUser = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    import uuid
    from sqlalchemy import func

    # 收集统计数据
    approval_stats = db.execute(
        select(
            func.count(ApprovalRequest.id).label("pending"),
        ).where(ApprovalRequest.status == "pending")
    ).scalar() or 0

    high_risk_count = db.execute(
        select(func.count(ApprovalRequest.id))
        .where(ApprovalRequest.risk_level == "high", ApprovalRequest.status == "pending")
    ).scalar() or 0

    today_processed = db.execute(
        select(func.count(ApprovalRequest.id))
        .where(ApprovalRequest.status.in_(["approved", "rejected"]))
    ).scalar() or 0

    person_stats = db.execute(select(func.count(Person.id))).scalar() or 0
    face_registered = db.execute(
        select(func.count(Person.id)).where(Person.face_registered == True)
    ).scalar() or 0

    stats = {
        "pending_count": approval_stats,
        "high_risk_count": high_risk_count,
        "today_processed": today_processed,
        "yesterday_count": 0,
        "compliance_rate": 0.0,
        "face_completion_rate": round(face_registered / person_stats * 100, 1) if person_stats > 0 else 0.0,
        "total_count": person_stats,
    }

    ai_service = AIBriefingService()
    content, title, tags = ai_service.generate(stats)

    today = date.today()
    existing = db.execute(select(DailyBriefing).where(DailyBriefing.date == today)).scalar_one_or_none()

    if existing:
        existing.title = title
        existing.content = content
        existing.tags = tags
        briefing_id = existing.id
    else:
        from app.models.briefing import DailyBriefing as BriefingModel
        briefing = BriefingModel(
            title=title, content=content, tags=tags,
            date=today, generated_by=uuid.UUID(current_user.id),
        )
        db.add(briefing)
        db.flush()
        briefing_id = briefing.id

    AuditService.log_sync(
        db=db,
        user_id=uuid.UUID(current_user.id),
        action="generate_briefing",
        resource_type="briefing",
        resource_id=briefing_id,
        detail={"title": title, "tags": tags},
        ip_address=request.client.host if request.client else None,
    )

    return {"message": "晨报生成成功", "title": title, "content": content,
            "tags": tags, "date": str(today)}
