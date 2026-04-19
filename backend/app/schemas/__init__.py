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
from app.schemas.student import (
    StudentLoginRequest, StudentRegisterRequest, StudentLoginResponse,
    StudentProfileResponse, ChangePasswordRequest,
)
from app.schemas.student_schedule import CourseCreate, CourseResponse, OcrCourseResponse
from app.schemas.student_leave import LeaveApplyRequest, LeaveRequestResponse, VoiceParseRequest, VoiceParseResponse
from app.schemas.student_task import TaskResponse
from app.schemas.student_notification import NotificationResponse, MarkReadRequest
from app.schemas.student_home import StudentHomeResponse, AISummarizedNotice

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
    # 学生端 Schema
    "StudentLoginRequest",
    "StudentRegisterRequest",
    "StudentLoginResponse",
    "StudentProfileResponse",
    "ChangePasswordRequest",
    "CourseCreate",
    "CourseResponse",
    "OcrCourseResponse",
    "LeaveApplyRequest",
    "LeaveRequestResponse",
    "VoiceParseRequest",
    "VoiceParseResponse",
    "TaskResponse",
    "NotificationResponse",
    "MarkReadRequest",
    "StudentHomeResponse",
    "AISummarizedNotice",
]
