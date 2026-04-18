"""
Tests for person management service.
"""
from __future__ import annotations

import pytest
from sqlalchemy import select
from app.services.person_service import PersonService
from app.schemas.person import PersonCreate, PersonUpdate
from app.models.person import Person


class TestPersonService:
    def test_create_person(self, db_session):
        service = PersonService(db_session)
        data = PersonCreate(
            student_id="20240002",
            name="New Student",
            dept="Class 2",
            role_type="student",
        )
        person = service.create(data)
        assert person.id is not None
        assert person.student_id == "20240002"
        assert person.name == "New Student"
        assert person.face_registered is False

    def test_create_duplicate_student_id(self, db_session, test_person):
        service = PersonService(db_session)
        # Count before
        items_before, _ = service.list_paginated(page=1, page_size=100)
        count_before = len(items_before)
        # Try to create duplicate
        data = PersonCreate(
            student_id=test_person.student_id,
            name="Duplicate",
            role_type="student",
        )
        _, fail_count = service.create_batch([data])
        assert fail_count == 1
        # Count after - should be same
        items_after, _ = service.list_paginated(page=1, page_size=100)
        assert len(items_after) == count_before

    def test_list_paginated(self, db_session, test_person):
        service = PersonService(db_session)
        items, total = service.list_paginated(page=1, page_size=10)
        assert total >= 1
        assert any(p.student_id == test_person.student_id for p in items)

    def test_list_search(self, db_session, test_person):
        service = PersonService(db_session)
        items, total = service.list_paginated(search="Test")
        assert total >= 1
        assert items[0].name == "Test Student"

    def test_get_stats(self, db_session, test_person):
        service = PersonService(db_session)
        stats = service.get_stats()
        assert stats["total"] >= 1
        assert "student_count" in stats
        assert "face_completion_rate" in stats
        assert isinstance(stats["face_completion_rate"], float)

    def test_update_person(self, db_session, test_person):
        service = PersonService(db_session)
        updated = service.update(
            test_person.id,
            PersonUpdate(name="Updated Name", dept="New Dept"),
        )
        assert updated is not None
        assert updated.name == "Updated Name"
        assert updated.dept == "New Dept"

    def test_delete_person(self, db_session, test_person):
        service = PersonService(db_session)
        result = service.delete(test_person.id)
        assert result is True
        assert service.get_by_id(test_person.id) is None

    def test_batch_import(self, db_session):
        service = PersonService(db_session)
        persons_data = [
            PersonCreate(student_id=f"2024{i:04d}", name=f"Student {i}", role_type="student")
            for i in range(5)
        ]
        success, fail = service.create_batch(persons_data)
        assert success == 5
        assert fail == 0
        items, total = service.list_paginated(page=1, page_size=100)
        assert total >= 5
