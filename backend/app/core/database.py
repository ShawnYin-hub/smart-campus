"""
数据库连接模块（同步模式）
"""
from __future__ import annotations
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

_db_url = settings.database_url

if "sqlite" in _db_url or not _db_url.startswith("postgresql"):
    engine = create_engine(
        "sqlite:///./smart_campus.db",
        echo=settings.debug,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        _db_url,
        echo=settings.debug,
        pool_pre_ping=True,
        pool_size=20,      # 增加连接池（默认5→20）
        max_overflow=40,   # 增加溢出连接（默认5→40）
        pool_recycle=3600, # 1小时回收空闲连接
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
