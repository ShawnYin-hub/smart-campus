"""
FastAPI 应用入口
"""
from __future__ import annotations
import logging
import logging.config
import secrets
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import auth, users, persons, approvals, briefing, dashboard, notifications, student

# ---- 统一日志配置（必须在导入其他 app 模块前执行） ----
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "detailed": {
            "format": "%(asctime)s [%(levelname)s] %(name)s [%(filename)s:%(lineno)d] %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "DEBUG" if settings.debug else "INFO",
            "formatter": "default",
            "stream": "ext://sys.stdout",
        },
    },
    "root": {
        "level": "DEBUG" if settings.debug else "INFO",
        "handlers": ["console"],
    },
    "loggers": {
        "app": {"level": "DEBUG" if settings.debug else "INFO"},
        "uvicorn": {"level": "INFO"},
        "sqlalchemy.engine": {"level": "WARNING"},  # SQL 日志默认关闭（verbose）
    },
}
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="BHSFIC 智能校园系统后端 API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常捕获：禁止向客户端暴露内部错误细节"""
    logger.exception("Unhandled exception on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": 500,
            "message": "服务器内部错误，请联系管理员",
            "detail": str(exc) if settings.debug else None,
        },
    )


@app.get("/api/v1/health", tags=["系统"])
def health_check():
    return {"status": "ok", "version": settings.app_version}


# 注册路由
api_v1 = FastAPI(title="API v1")
api_v1.include_router(auth.router)
api_v1.include_router(users.router)
api_v1.include_router(persons.router)
api_v1.include_router(approvals.router)
api_v1.include_router(briefing.router)
api_v1.include_router(dashboard.router)
api_v1.include_router(notifications.router)
api_v1.include_router(student.router)
app.mount("/api/v1", api_v1)


@app.on_event("startup")
def on_startup():
    from app.core.database import init_db, SessionLocal
    from app.models.user import User
    from app.core.security import hash_password
    from sqlalchemy import select

    logger.info("Starting BHSFIC Smart Campus API v%s", settings.app_version)

    # 创建所有表
    init_db()
    logger.info("Database tables initialized")

    # 创建默认管理员（仅首次启动时）
    db = SessionLocal()
    try:
        existing_admin = db.execute(select(User).where(User.username == "admin")).scalar_one_or_none()
        if existing_admin is None:
            # 生成随机默认密码（首次使用后应立即更改）
            default_pw = f"admin{secrets.randbelow(900000) + 100000}"
            admin = User(
                username="admin",
                email="admin@campus.edu.cn",
                hashed_password=hash_password(default_pw),
                full_name="System Administrator",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            logger.warning(
                "DEFAULT ADMIN ACCOUNT CREATED — Username: admin | Password: %s | "
                "PLEASE CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN", default_pw
            )
            print("=" * 60)
            print("  Default admin account created!")
            print(f"  Username: admin")
            print(f"  Password: {default_pw}")
            print("  PLEASE CHANGE THIS PASSWORD AFTER FIRST LOGIN!")
            print("=" * 60)
        else:
            logger.info("Admin account already exists, skipping creation")
            print("[OK] Admin account already exists, skipping creation.")
    finally:
        db.close()

    logger.info("Application startup complete")
