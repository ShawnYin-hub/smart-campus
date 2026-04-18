"""
Person 相关的 Pydantic 模型
"""
from __future__ import annotations
import re
from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.validators import (
    ChineseIdCard, ChinesePhone,
    ROLE_STUDENT, ROLE_TEACHER, VALID_ROLE_TYPES,
)


class PersonCreate(BaseModel):
    """创建人员档案"""
    student_id: str = Field(..., min_length=1, max_length=30, description="学号/工号")
    name: str = Field(..., min_length=1, max_length=100, description="姓名")
    dept: Optional[str] = Field(default=None, max_length=100, description="部门/班级")
    role_type: Literal["student", "teacher"] = Field(
        default="student",
        description="类型：student / teacher",
    )
    phone: Optional[str] = Field(default=None, max_length=20, description="联系电话")
    id_card: Optional[ChineseIdCard] = Field(default=None, description="身份证号")

    @field_validator("id_card", mode="after")
    @classmethod
    def _validate_id_card(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().upper()
        return v

    @field_validator("phone", mode="after")
    @classmethod
    def _validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            phone = v.strip()
            if not phone.startswith("+"):
                phone = re.sub(r"[^\d]", "", phone)
                if len(phone) == 11:
                    return phone
            return phone
        return None


class PersonUpdate(BaseModel):
    """更新人员档案"""
    name: Optional[str] = Field(default=None, max_length=100)
    dept: Optional[str] = Field(default=None, max_length=100)
    role_type: Optional[Literal["student", "teacher"]] = Field(default=None)
    phone: Optional[str] = Field(default=None, max_length=20)
    id_card: Optional[ChineseIdCard] = Field(default=None, max_length=20)
    face_registered: Optional[bool] = Field(default=None)
    face_image_url: Optional[str] = Field(default=None, max_length=500)
    device_id: Optional[str] = Field(default=None, max_length=50)  # Phase 2 预留

    @field_validator("id_card", mode="after")
    @classmethod
    def _validate_id_card(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().upper()
        return v


class PersonResponse(BaseModel):
    """人员响应"""
    id: str
    student_id: str
    name: str
    dept: Optional[str] = None
    role_type: str
    phone: Optional[str] = None
    face_registered: bool
    face_image_url: Optional[str] = None
    device_id: Optional[str] = None  # Phase 2
    device_bind_time: Optional[datetime] = None  # Phase 2
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PersonListResponse(BaseModel):
    """人员列表响应"""
    items: list[PersonResponse]
    total: int
    page: int
    page_size: int
    pending_face_count: int = 0


class PersonStatsResponse(BaseModel):
    """人员统计响应"""
    total: int = Field(..., description="总人数")
    student_count: int = Field(..., description="学生数")
    teacher_count: int = Field(..., description="教职工数")
    face_registered_count: int = Field(..., description="已录入人脸数")
    face_pending_count: int = Field(..., description="待录入人脸数")
    face_completion_rate: float = Field(..., description="人脸录入完成率（百分比）")
    attendance_rate: float = Field(default=0.0, description="今日出勤率（Phase 2）")


class BatchImportRequest(BaseModel):
    """
    批量导入请求。
    前端上传 Excel 后解析为 JSON 数组传过来，
    后端不再重复解析 Excel（降低依赖复杂度）。
    """
    persons: List[PersonCreate] = Field(..., description="人员数据列表")
