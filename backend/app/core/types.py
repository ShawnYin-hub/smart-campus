"""
数据库工具：跨数据库兼容类型
SQLite 本地开发用 String 存储 UUID，生产 PostgreSQL 环境下自动使用原生 UUID。
"""
import uuid
from sqlalchemy import String, DateTime
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


class GUID(TypeDecorator):
    """跨数据库的 UUID 类型：PostgreSQL 用原生 UUID，SQLite 用 String(36)"""
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value if isinstance(value, uuid.UUID) else uuid.UUID(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)


class TZDateTime(TypeDecorator):
    """跨数据库的时区日期时间：PostgreSQL 支持时区，SQLite 不支持则降级为普通 DateTime"""
    impl = DateTime
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(DateTime(timezone=True))
        return dialect.type_descriptor(DateTime)

    def process_bind_param(self, value, dialect):
        return value

    def process_result_value(self, value, dialect):
        return value
