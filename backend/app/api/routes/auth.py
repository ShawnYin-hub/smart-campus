"""
认证路由（同步版本）
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user, CurrentUser
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService
from app.schemas.auth import Token, LoginResponse

router = APIRouter(prefix="/auth", tags=["认证"])


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1, description="当前密码")
    new_password: str = Field(..., min_length=6, max_length=128, description="新密码")


@router.post("/login", response_model=LoginResponse, summary="用户登录")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    auth_service = AuthService(db)
    user = auth_service.authenticate(form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    AuditService.log_sync(
        db=db,
        user_id=user.id,
        action="login",
        resource_type="auth",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return auth_service.create_token(user)


@router.get("/me", summary="获取当前用户信息")
def get_me(
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(current_user.id)
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")

    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
    }


@router.post("/change-password", summary="修改当前用户密码")
def change_password(
    request: Request,
    data: ChangePasswordRequest,
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(current_user.id)
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")

    if not auth_service.verify_password(data.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="当前密码错误")

    auth_service.update_password(user, data.new_password)

    AuditService.log_sync(
        db=db,
        user_id=user.id,
        action="change_password",
        resource_type="auth",
        ip_address=request.client.host if request.client else None,
    )

    return {"message": "密码修改成功"}
