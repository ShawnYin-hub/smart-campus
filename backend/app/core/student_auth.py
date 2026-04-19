"""
学生账号 JWT 认证依赖
"""
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models import StudentAccount

oauth2_scheme_student = OAuth2PasswordBearer(
    tokenUrl="/api/v1/student/auth/login",
    auto_error=False,
)


class CurrentStudent:
    def __init__(self, account_id: str, name: str, student_id: str):
        self.id = account_id
        self.name = name
        self.student_id = student_id


async def get_current_student(
    token: str = Depends(oauth2_scheme_student),
    db: Session = Depends(get_db),
) -> CurrentStudent:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="登录已过期，请重新登录",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    account_id: str = payload.get("sub")
    if not account_id:
        raise credentials_exception

    # 验证 token 类型为学生
    if payload.get("type") != "student":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的学生登录凭证",
        )

    try:
        account_uuid = uuid.UUID(account_id)
    except ValueError:
        raise credentials_exception

    account = db.query(StudentAccount).filter(
        StudentAccount.id == account_uuid
    ).first()

    if account is None:
        raise credentials_exception

    if not account.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用",
        )

    return CurrentStudent(
        account_id=account_id,
        name=account.name,
        student_id=account.student_id,
    )
