"""
安全认证模块
包含：JWT Token 生成/验证、密码哈希、OAuth2 依赖注入。
"""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings

import logging
logger = logging.getLogger(__name__)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证明文密码与哈希值是否匹配"""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def hash_password(password: str) -> str:
    """对密码进行哈希（存储时使用）"""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(rounds=settings.bcrypt_rounds)
    ).decode("utf-8")


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        return payload
    except JWTError as e:
        logger.warning("Token decode failed: %s", e)
        return None


class UserRole:
    ADMIN = "admin"
    OPERATOR = "operator"
    STUDENT = "student"


class CurrentUser:
    def __init__(self, user_id: str, username: str, role: str, email: Optional[str] = None):
        self.id = user_id
        self.username = username
        self.role = role
        self.email = email

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @property
    def is_operator(self) -> bool:
        return self.role == UserRole.OPERATOR

    @property
    def is_student(self) -> bool:
        return self.role == UserRole.STUDENT

    @property
    def can_manage_approvals(self) -> bool:
        return self.role in (UserRole.ADMIN, UserRole.OPERATOR)

    @property
    def can_manage_personnel(self) -> bool:
        return self.role in (UserRole.ADMIN, UserRole.OPERATOR)


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> CurrentUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token has expired or is invalid, please login again",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        logger.warning("Missing authentication token")
        raise credentials_exception
    payload = decode_token(token)
    if payload is None:
        logger.warning("Invalid authentication token")
        raise credentials_exception
    user_id: str = payload.get("sub")
    if not user_id:
        logger.warning("Token payload missing 'sub' claim")
        raise credentials_exception
    return CurrentUser(
        user_id=user_id,
        username=payload.get("username", ""),
        role=payload.get("role", "student"),
        email=payload.get("email", ""),
    )


async def get_current_active_user(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    return current_user


def require_role(*allowed_roles: str):
    async def checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed_roles:
            logger.warning(
                "Access denied: user %s (role=%s) attempted action requiring roles=%s",
                current_user.username, current_user.role, allowed_roles,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires {allowed_roles} permission",
            )
        return current_user
    return checker
