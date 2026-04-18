"""
Schemas 模块初始化
统一导出所有 Pydantic 模型。
"""
from app.schemas.auth import Token, TokenPayload, LoginRequest
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.schemas.person import (
    PersonCreate,
    PersonUpdate,
    PersonResponse,
    PersonListResponse,
    PersonStatsResponse,
    BatchImportRequest,
)
from app.schemas.approval import (
    ApprovalCreate,
    ApprovalUpdate,
    ApprovalResponse,
    ApprovalListResponse,
    ApprovalReviewRequest,
    ApprovalStatsResponse,
)
from app.schemas.common import PaginatedResponse, ApiResponse

__all__ = [
    "Token",
    "TokenPayload",
    "LoginRequest",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserListResponse",
    "PersonCreate",
    "PersonUpdate",
    "PersonResponse",
    "PersonListResponse",
    "PersonStatsResponse",
    "BatchImportRequest",
    "ApprovalCreate",
    "ApprovalUpdate",
    "ApprovalResponse",
    "ApprovalListResponse",
    "ApprovalReviewRequest",
    "ApprovalStatsResponse",
    "PaginatedResponse",
    "ApiResponse",
]
