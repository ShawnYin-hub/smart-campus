"""
User 相关的 Pydantic 模型
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr


class UserCreate(BaseModel):
    """创建用户请求"""
    username: str = Field(..., min_length=3, max_length=50, description="登录账号")
    email: EmailStr = Field(..., description="邮箱")
    password: str = Field(..., min_length=6, max_length=128, description="密码")
    full_name: Optional[str] = Field(default=None, max_length=100, description="显示名称")
    role: str = Field(default="operator", description="角色：admin / operator")


class UserUpdate(BaseModel):
    """更新用户请求"""
    email: Optional[EmailStr] = Field(default=None, description="邮箱")
    full_name: Optional[str] = Field(default=None, max_length=100, description="显示名称")
    role: Optional[str] = Field(default=None, description="角色")
    is_active: Optional[bool] = Field(default=None, description="是否激活")


class UserPasswordUpdate(BaseModel):
    """修改密码请求"""
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=6, max_length=128, description="新密码")


class UserResponse(BaseModel):
    """用户响应"""
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    """用户列表响应"""
    items: list[UserResponse]
    total: int
    page: int
    page_size: int
