"""
学生首页汇总 Pydantic Schema
"""
from pydantic import BaseModel
from app.schemas.student_schedule import CourseResponse
from app.schemas.student_task import TaskResponse
from app.schemas.student_notification import NotificationResponse


class AISummarizedNotice(BaseModel):
    id: str
    event: str
    time: str
    location: str
    originalText: str


class StudentHomeResponse(BaseModel):
    student_id: str
    name: str
    avatar_url: str
    today_schedule: list[CourseResponse]
    tasks: list[TaskResponse]
    notifications: list[NotificationResponse]
    ai_notices: list[AISummarizedNotice]
