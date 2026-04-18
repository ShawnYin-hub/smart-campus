"""
管理员管理路由（同步版本）
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_active_user, CurrentUser, require_role, UserRole
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/users", tags=["管理员管理"])


@router.get("", response_model=list[UserResponse], summary="获取管理员列表")
def list_users(
    current_user: CurrentUser = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    users = db.execute(select(User).order_by(User.created_at.desc())).scalars().all()
    return [
        {"id": str(u.id), "username": u.username, "email": u.email,
         "full_name": u.full_name, "role": u.role, "is_active": u.is_active,
         "created_at": u.created_at, "updated_at": u.updated_at}
        for u in users
    ]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="创建管理员")
def create_user(
    request: Request,
    data: UserCreate,
    current_user: CurrentUser = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    from app.core.security import hash_password
    existing = db.execute(
        select(User).where((User.username == data.username) | (User.email == data.email))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="用户名或邮箱已存在")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    db.add(user)
    db.flush()
    db.refresh(user)

    AuditService.log_sync(
        db=db,
        user_id=uuid.UUID(current_user.id),
        action="create_user",
        resource_type="user",
        resource_id=user.id,
        detail={"username": user.username, "role": user.role},
        ip_address=request.client.host if request.client else None,
    )

    return {
        "id": str(user.id), "username": user.username, "email": user.email,
        "full_name": user.full_name, "role": user.role, "is_active": user.is_active,
        "created_at": user.created_at, "updated_at": user.updated_at,
    }


@router.get("/{user_id}", response_model=UserResponse, summary="获取管理员详情")
def get_user(
    user_id: str,
    current_user: CurrentUser = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    user = db.execute(select(User).where(User.id == uuid.UUID(user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="管理员不存在")
    return {
        "id": str(user.id), "username": user.username, "email": user.email,
        "full_name": user.full_name, "role": user.role, "is_active": user.is_active,
        "created_at": user.created_at, "updated_at": user.updated_at,
    }


@router.put("/{user_id}", response_model=UserResponse, summary="更新管理员")
def update_user(
    request: Request,
    user_id: str,
    data: UserUpdate,
    current_user: CurrentUser = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    user = db.execute(select(User).where(User.id == uuid.UUID(user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="管理员不存在")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.flush()
    db.refresh(user)

    AuditService.log_sync(
        db=db,
        user_id=uuid.UUID(current_user.id),
        action="update_user",
        resource_type="user",
        resource_id=user.id,
        detail={"updated_fields": list(data.model_dump(exclude_unset=True).keys())},
        ip_address=request.client.host if request.client else None,
    )

    return {
        "id": str(user.id), "username": user.username, "email": user.email,
        "full_name": user.full_name, "role": user.role, "is_active": user.is_active,
        "created_at": user.created_at, "updated_at": user.updated_at,
    }


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="删除管理员")
def delete_user(
    request: Request,
    user_id: str,
    current_user: CurrentUser = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="不能删除自己的账号")
    user = db.execute(select(User).where(User.id == uuid.UUID(user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="管理员不存在")

    db.delete(user)
    db.flush()

    AuditService.log_sync(
        db=db,
        user_id=uuid.UUID(current_user.id),
        action="delete_user",
        resource_type="user",
        resource_id=uuid.UUID(user_id),
        ip_address=request.client.host if request.client else None,
    )
