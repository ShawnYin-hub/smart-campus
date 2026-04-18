"""
Approval 相关的 Pydantic 模型
"""
from __future__ import annotations
from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator


class ApprovalCreate(BaseModel):
    """创建审批请求"""
    person_id: str = Field(..., description="申请人档案ID")
    type: Literal["leave_school", "visitor", "other"] = Field(
        default="leave_school",
        description="申请类型：leave_school / visitor / other",
    )
    start_time: Optional[datetime] = Field(default=None, description="开始时间")
    end_time: Optional[datetime] = Field(default=None, description="结束时间")
    reason: str = Field(..., min_length=1, max_length=1000, description="申请事由")

    @model_validator(mode="after")
    def _validate_time_range(self) -> "ApprovalCreate":
        if self.start_time and self.end_time:
            if self.end_time < self.start_time:
                raise ValueError("结束时间不能早于开始时间")
        return self


class ApprovalUpdate(BaseModel):
    """更新审批请求（仅在待审批状态下可更新）"""
    type: Optional[Literal["leave_school", "visitor", "other"]] = Field(default=None)
    start_time: Optional[datetime] = Field(default=None)
    end_time: Optional[datetime] = Field(default=None)
    reason: Optional[str] = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def _validate_time_range(self) -> "ApprovalUpdate":
        if self.start_time and self.end_time:
            if self.end_time < self.start_time:
                raise ValueError("结束时间不能早于开始时间")
        return self


class ApprovalReviewRequest(BaseModel):
    """审批操作请求"""
    comment: Optional[str] = Field(default=None, max_length=500, description="审批意见（可选）")


class PersonBrief(BaseModel):
    """审批响应中的申请人简要信息"""
    id: str
    name: str
    student_id: str

    model_config = {"from_attributes": True}


class ApprovalResponse(BaseModel):
    """审批响应"""
    id: str
    person_id: str
    person: Optional[PersonBrief] = None
    type: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    reason: str
    risk_level: str
    risk_reason: Optional[str] = None
    alert: bool
    status: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_comment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ApprovalListResponse(BaseModel):
    """审批列表响应"""
    items: list[ApprovalResponse]
    total: int
    page: int
    page_size: int


class ApprovalStatsResponse(BaseModel):
    """审批统计响应"""
    pending_count: int = Field(..., description="当前待审批数")
    today_processed: int = Field(default=0, description="今日已处理数")
    yesterday_count: int = Field(default=0, description="昨日同期数")
    compliance_rate: float = Field(default=0.0, description="系统合规率（已通过/总数）")
