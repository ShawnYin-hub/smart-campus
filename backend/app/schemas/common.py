"""
通用 Pydantic 模型
分页响应、通用 API 响应等。
"""
from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """通用分页响应"""
    items: List[T]
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码（1-indexed）")
    page_size: int = Field(..., description="每页条数")
    total_pages: int = Field(..., description="总页数")

    model_config = {"from_attributes": True}


class ApiResponse(BaseModel, Generic[T]):
    """通用 API 响应包装"""
    code: int = Field(default=200, description="状态码")
    message: str = Field(default="操作成功", description="提示信息")
    data: Optional[T] = Field(default=None, description="响应数据")

    model_config = {"from_attributes": True}
