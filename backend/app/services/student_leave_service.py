"""
学生请假服务
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import StudentLeave


class StudentLeaveService:
    def __init__(self, db: Session):
        self.db = db

    def apply(
        self,
        student_id: uuid.UUID,
        leave_type: str,
        date_range: str,
        reason: str,
    ) -> StudentLeave:
        leave = StudentLeave(
            student_id=student_id,
            leave_type=leave_type,
            date_range=date_range,
            reason=reason,
            status="pending",
        )
        self.db.add(leave)
        self.db.commit()
        self.db.refresh(leave)
        return leave

    def get_history(self, student_id: uuid.UUID) -> list[StudentLeave]:
        """获取请假历史（最新的在前）"""
        return (
            self.db.query(StudentLeave)
            .filter(StudentLeave.student_id == student_id)
            .order_by(StudentLeave.created_at.desc())
            .all()
        )

    def update_status(self, leave_id: uuid.UUID, status: str) -> StudentLeave | None:
        """管理员更新请假状态"""
        leave = self.db.query(StudentLeave).filter(StudentLeave.id == leave_id).first()
        if leave is None:
            return None
        leave.status = status
        leave.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(leave)
        return leave
