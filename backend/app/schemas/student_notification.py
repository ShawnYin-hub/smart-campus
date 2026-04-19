"""
学生通知相关 Pydantic Schema
"""
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    sender: str
    content: str
    time: str
    type: str  # school/teacher/homework
    isRead: bool


class MarkReadRequest(BaseModel):
    pass
