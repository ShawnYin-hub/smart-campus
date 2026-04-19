"""
学生账号认证服务
"""
import uuid
import logging
from sqlalchemy.orm import Session

from app.models import StudentAccount
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings

logger = logging.getLogger(__name__)


class StudentAuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, student_id: str, name: str, password: str) -> tuple[StudentAccount, str]:
        """注册新学生账号，返回 (account, access_token)"""
        # 检查是否已存在
        existing = self.db.query(StudentAccount).filter(
            StudentAccount.student_id == student_id
        ).first()
        if existing:
            raise ValueError(f"学号 {student_id} 已存在")

        account = StudentAccount(
            student_id=student_id,
            name=name,
            hashed_password=hash_password(password),
        )
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)

        token = self._create_token(str(account.id))
        logger.info("Student registered: %s [%s]", name, student_id)
        return account, token

    def login(self, student_id: str, password: str) -> tuple[StudentAccount, str]:
        """登录，返回 (account, access_token)"""
        account = self.db.query(StudentAccount).filter(
            StudentAccount.student_id == student_id
        ).first()

        if account is None:
            raise ValueError("学号或密码错误")

        if not verify_password(password, account.hashed_password):
            raise ValueError("学号或密码错误")

        if not account.is_active:
            raise ValueError("账号已被禁用")

        token = self._create_token(str(account.id))
        logger.info("Student logged in: %s [%s]", account.name, student_id)
        return account, token

    def get_by_id(self, account_id: uuid.UUID) -> StudentAccount | None:
        return self.db.query(StudentAccount).filter(
            StudentAccount.id == account_id
        ).first()

    def get_by_student_id(self, student_id: str) -> StudentAccount | None:
        return self.db.query(StudentAccount).filter(
            StudentAccount.student_id == student_id
        ).first()

    def change_password(self, account_id: uuid.UUID, old_password: str, new_password: str) -> bool:
        """修改密码，返回是否成功"""
        account = self.get_by_id(account_id)
        if account is None:
            raise ValueError("账号不存在")

        if not verify_password(old_password, account.hashed_password):
            raise ValueError("当前密码错误")

        account.hashed_password = hash_password(new_password)
        self.db.commit()
        logger.info("Student password changed: %s [%s]", account.name, account.student_id)
        return True

    def _create_token(self, account_id: str) -> str:
        return create_access_token(
            data={"sub": account_id, "type": "student"},
        )
