"""
学生课表相关 Pydantic Schema
"""
from pydantic import BaseModel, Field


class CourseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="课程名称")
    time: str = Field(..., min_length=1, max_length=50, description="上课时间，如 09:00 - 10:40")
    location: str = Field(..., max_length=100, description="上课地点")
    course_type: str = Field(default="science", description="课程类型：science/book/math/calculus")


class CourseResponse(BaseModel):
    id: str
    name: str
    time: str
    location: str
    type: str


class OcrCourseResponse(BaseModel):
    courses: list[CourseResponse]
