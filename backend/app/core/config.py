"""
配置管理模块
所有环境变量从此处集中读取，使用 Pydantic Settings 进行类型校验。
"""
from __future__ import annotations
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用全局配置，从 .env 文件加载"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- 数据库 ----
    database_url: str = "postgresql://postgres:postgres@localhost:5432/smart_campus"

    # ---- JWT ----
    secret_key: str = "changeme-replace-with-secure-random-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8小时

    # ---- 安全 ----
    bcrypt_rounds: int = 12  # bcrypt cost factor，数值越高越安全但越慢

    # ---- DeepSeek AI ----
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    ai_timeout_seconds: int = 30  # AI API 超时（秒）

    # ---- CORS ----
    backend_cors_origins: str = '["http://localhost:3000","http://localhost","http://127.0.0.1:3000","http://127.0.0.1","*"]'

    @property
    def cors_origins(self) -> List[str]:
        """将字符串格式的 CORS 列表解析为 Python 列表"""
        import json
        return json.loads(self.backend_cors_origins)

    # ---- 应用信息 ----
    app_name: str = "BHSFIC Smart Campus"
    app_version: str = "1.0.0"
    debug: bool = False


# 全局单例实例，整个应用共享
settings = Settings()
