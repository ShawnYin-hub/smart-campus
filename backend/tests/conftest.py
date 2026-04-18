"""
Shared pytest fixtures for the backend test suite.
"""
from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.core.security import hash_password
from app.models.user import User
from app.models.person import Person
from app.models.approval import ApprovalRequest
from app.models.audit_log import AuditLog
from app.models.notification import Notification


@pytest.fixture
def db_engine():
    """In-memory SQLite engine for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(db_engine):
    """Database session for a test."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def admin_user(db_session) -> User:
    """Create a test admin user."""
    user = User(
        username="testadmin",
        email="testadmin@example.com",
        hashed_password=hash_password("testpass123"),
        full_name="Test Admin",
        role="admin",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def operator_user(db_session) -> User:
    """Create a test operator user."""
    user = User(
        username="testoperator",
        email="testoperator@example.com",
        hashed_password=hash_password("testpass123"),
        full_name="Test Operator",
        role="operator",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_person(db_session) -> Person:
    """Create a test person record."""
    person = Person(
        student_id="20240001",
        name="Test Student",
        dept="Class 1 Grade 1",
        role_type="student",
        phone="13800000001",
        face_registered=True,
    )
    db_session.add(person)
    db_session.commit()
    db_session.refresh(person)
    return person
