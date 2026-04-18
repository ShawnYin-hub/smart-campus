"""
认证相关的 Pydantic 模型
"""
from typing import Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """登录请求"""
    username: str = Field(..., min_length=1, max_length=50, description="用户名")
    password: str = Field(..., min_length=1, description="密码")


class Token(BaseModel):
    """登录成功返回的 Token"""
    access_token: str = Field(..., description="JWT Access Token")
    token_type: str = Field(default="bearer", description="Token 类型")


class TokenPayload(BaseModel):
    """JWT Token 载荷"""
    sub: str = Field(..., description="用户 ID")
    username: str = Field(..., description="用户名")
    role: str = Field(..., description="角色")
    email: Optional[str] = Field(default=None, description="邮箱")
    exp: Optional[int] = Field(default=None, description="过期时间戳")


class LoginResponse(BaseModel):
    """登录成功响应"""
    access_token: str
    token_type: str = "bearer"
    user: "UserBrief"


class UserBrief(BaseModel):
    """用户简要信息（登录后返回给前端）"""
    id: str
    username: str
    full_name: Optional[str] = None
    email: str
    role: str

    model_config = {"from_attributes": True}
