"""
总览大屏路由（同步版本）
"""
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_active_user, CurrentUser
from app.models.approval import ApprovalRequest
from app.models.briefing import DailyBriefing
from app.models.person import Person

router = APIRouter(prefix="/dashboard", tags=["总览大屏"])


@router.get("/overview", summary="获取总览数据")
def get_overview(
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    today = date.today()

    # AI 晨报
    briefing = db.execute(
        select(DailyBriefing).where(DailyBriefing.date == today)
    ).scalar_one_or_none()

    briefing_data = None
    if briefing:
        briefing_data = {"title": briefing.title, "content": briefing.content, "tags": briefing.tags or []}

    # 审批统计
    pending_count = db.execute(
        select(func.count(ApprovalRequest.id)).where(ApprovalRequest.status == "pending")
    ).scalar() or 0

    high_risk_count = db.execute(
        select(func.count(ApprovalRequest.id))
        .where(ApprovalRequest.risk_level == "high", ApprovalRequest.status == "pending")
    ).scalar() or 0

    today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
    today_end = datetime.combine(today, datetime.max.time()).replace(tzinfo=timezone.utc)
    today_processed = db.execute(
        select(func.count(ApprovalRequest.id))
        .where(ApprovalRequest.status.in_(["approved", "rejected"]),
               ApprovalRequest.reviewed_at >= today_start, ApprovalRequest.reviewed_at <= today_end)
    ).scalar() or 0

    # 人员统计
    total_count = db.execute(select(func.count(Person.id))).scalar() or 0
    face_registered_count = db.execute(
        select(func.count(Person.id)).where(Person.face_registered == True)
    ).scalar() or 0
    face_completion_rate = round(face_registered_count / total_count * 100, 1) if total_count > 0 else 0.0

    return {
        "briefing": briefing_data or {
            "title": "AI 每日晨报",
            "content": "暂无今日简报数据，请在系统后台进行配置或等待系统自动生成...",
            "tags": [],
        },
        "stats": [
            {
                "label": "人脸录入完成率",
                "percentage": face_completion_rate,
                "completedText": "Completed",
                "subStats": [
                    {"label": "已注册", "value": face_registered_count},
                    {"label": "待录入", "value": total_count - face_registered_count},
                ],
                "colorClass": "text-mahogany",
            },
            {
                "label": "今日出勤分布",
                "percentage": 0.0,
                "completedText": "Attended",
                "subStats": [{"label": "在校生", "value": 0}, {"label": "教职工", "value": 0}],
                "colorClass": "text-midnight",
            },
        ],
        "stats_raw": {
            "pending_count": pending_count,
            "high_risk_count": high_risk_count,
            "today_processed": today_processed,
            "total_count": total_count,
            "face_registered_count": face_registered_count,
            "face_completion_rate": face_completion_rate,
        },
    }


@router.get("/alerts", summary="获取紧急告警列表")
def get_alerts(
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    alerts = db.execute(
        select(ApprovalRequest)
        .where(ApprovalRequest.alert == True, ApprovalRequest.status == "pending")
        .order_by(ApprovalRequest.created_at.desc())
        .limit(10)
    ).scalars().all()

    return {
        "alerts": [
            {
                "id": str(a.id),
                "title": f"{'离校' if a.type == 'leave_school' else '访客'}申请",
                "level": "紧急",
                "desc": a.risk_reason or (a.reason[:50] if a.reason else ""),
                "time": a.created_at.strftime("%Y-%m-%d %H:%M"),
                "type": "error",
                "risk_level": a.risk_level,
                "reason": a.reason,
            }
            for a in alerts
        ],
        "total": len(alerts),
    }
