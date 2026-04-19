"""
学生任务服务
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import StudentTask


class StudentTaskService:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, student_id: uuid.UUID) -> list[StudentTask]:
        return (
            self.db.query(StudentTask)
            .filter(StudentTask.student_id == student_id)
            .order_by(StudentTask.created_at.desc())
            .all()
        )

    def toggle(self, task_id: uuid.UUID, student_id: uuid.UUID) -> StudentTask | None:
        """切换任务完成状态"""
        task = (
            self.db.query(StudentTask)
            .filter(
                StudentTask.id == task_id,
                StudentTask.student_id == student_id,
            )
            .first()
        )
        if task is None:
            return None
        task.status = "completed" if task.status == "pending" else "pending"
        task.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(task)
        return task

    def create(
        self,
        student_id: uuid.UUID,
        title: str,
        deadline: str,
        task_type: str,
        urgency_level: str | None = None,
        ai_habit_summary: str | None = None,
    ) -> StudentTask:
        task = StudentTask(
            student_id=student_id,
            title=title,
            deadline=deadline,
            task_type=task_type,
            urgency_level=urgency_level,
            ai_habit_summary=ai_habit_summary,
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task
