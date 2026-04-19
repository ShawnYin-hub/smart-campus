"""
学生请假相关 Pydantic Schema
"""
from pydantic import BaseModel, Field


class LeaveApplyRequest(BaseModel):
    leave_type: str = Field(..., description="请假类型：事假/病假/年假")
    date_range: str = Field(..., description="请假日期范围，如 2024-12-05 - 2024-12-06")
    reason: str = Field(default="", max_length=500, description="请假原因")


class LeaveRequestResponse(BaseModel):
    id: str
    type: str
    dateRange: str
    reason: str
    status: str  # pending/approved/rejected


class VoiceParseRequest(BaseModel):
    text: str = Field(..., description="语音转文字后的描述，如 我明天感冒了需要请假两天")


class VoiceParseResponse(BaseModel):
    leave_type: str  # 事假/病假/年假
    date_range: str
    reason: str
