"""
认证服务（同步版本）
"""
import uuid
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import LoginRequest, LoginResponse, UserBrief


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate(self, username: str, password: str) -> Optional[User]:
        user = self.db.execute(
            select(User).where(User.username == username, User.is_active == True)
        ).scalar_one_or_none()
        if user is None:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def create_token(self, user: User) -> LoginResponse:
        token = create_access_token(
            data={
                "sub": str(user.id),
                "username": user.username,
                "role": user.role,
                "email": user.email,
            }
        )
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user=UserBrief(
                id=str(user.id),
                username=user.username,
                full_name=user.full_name,
                email=user.email,
                role=user.role,
            ),
        )

    def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        return self.db.execute(
            select(User).where(User.id == user_id)
        ).scalar_one_or_none()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        from app.core.security import verify_password as vp
        return vp(plain_password, hashed_password)

    def update_password(self, user: User, new_password: str) -> None:
        from app.core.security import hash_password
        user.hashed_password = hash_password(new_password)
        self.db.flush()

    def create_user(
        self,
        username: str,
        email: str,
        password: str,
        full_name: Optional[str] = None,
        role: str = "operator",
    ) -> User:
        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
        )
        self.db.add(user)
        self.db.flush()
        self.db.refresh(user)
        return user
