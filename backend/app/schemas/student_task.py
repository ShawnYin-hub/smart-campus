"""
学生任务相关 Pydantic Schema
"""
from pydantic import BaseModel


class TaskResponse(BaseModel):
    id: str
    title: str
    deadline: str
    type: str  # report/reading
    status: str  # pending/completed
    aiHabitSummary: str | None = None
    urgencyLevel: str | None = None  # low/medium/high
