"""
学生课表服务
"""
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.models import StudentSchedule


class StudentScheduleService:
    def __init__(self, db: Session):
        self.db = db

    def add(self, student_id: uuid.UUID, name: str, time: str, location: str, course_type: str) -> StudentSchedule:
        course = StudentSchedule(
            student_id=student_id,
            name=name,
            time=time,
            location=location,
            course_type=course_type,
        )
        self.db.add(course)
        self.db.commit()
        self.db.refresh(course)
        return course

    def get_today(self, student_id: uuid.UUID) -> list[StudentSchedule]:
        """获取该学生的所有课表（按时间排序）"""
        return (
            self.db.query(StudentSchedule)
            .filter(StudentSchedule.student_id == student_id)
            .order_by(StudentSchedule.created_at)
            .all()
        )

    def delete(self, schedule_id: uuid.UUID, student_id: uuid.UUID) -> bool:
        """删除课表（只能删除自己的）"""
        course = (
            self.db.query(StudentSchedule)
            .filter(
                StudentSchedule.id == schedule_id,
                StudentSchedule.student_id == student_id,
            )
            .first()
        )
        if course is None:
            return False
        self.db.delete(course)
        self.db.commit()
        return True
