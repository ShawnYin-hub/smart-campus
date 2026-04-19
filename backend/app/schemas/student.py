"""
学生账号相关 Pydantic Schema
"""
from pydantic import BaseModel, Field


class StudentLoginRequest(BaseModel):
    student_id: str = Field(..., min_length=1, description="学号/账号")
    password: str = Field(..., min_length=1, description="密码")


class StudentRegisterRequest(BaseModel):
    student_id: str = Field(..., min_length=1, max_length=30, description="学号/账号")
    name: str = Field(..., min_length=1, max_length=100, description="真实姓名")
    password: str = Field(..., min_length=6, max_length=128, description="密码（至少6位）")


class StudentLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    student_id: str
    name: str
    avatar_url: str


class StudentProfileResponse(BaseModel):
    student_id: str
    name: str
    avatar_url: str


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1, description="当前密码")
    new_password: str = Field(..., min_length=6, max_length=128, description="新密码")
