"""Person management service (sync version)."""
from __future__ import annotations
import uuid
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_

from app.models.person import Person
from app.schemas.person import PersonCreate, PersonUpdate

import logging
logger = logging.getLogger(__name__)


def _safe_div(numerator: float, denominator: float, default: float = 0.0) -> float:
    return round(numerator / denominator * 100, 1) if denominator > 0 else default


class PersonService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, person_id: uuid.UUID) -> Optional[Person]:
        return self.db.execute(
            select(Person).where(Person.id == person_id)
        ).scalar_one_or_none()

    def get_by_student_id(self, student_id: str) -> Optional[Person]:
        return self.db.execute(
            select(Person).where(Person.student_id == student_id)
        ).scalar_one_or_none()

    def list_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        role_type: Optional[str] = None,
    ) -> Tuple[List[Person], int]:
        query = select(Person)

        if search:
            pattern = f"%{search}%"
            query = query.where(
                or_(
                    Person.name.ilike(pattern),
                    Person.student_id.ilike(pattern),
                    Person.dept.ilike(pattern),
                )
            )
        if role_type:
            query = query.where(Person.role_type == role_type)

        total = self.db.execute(
            select(func.count()).select_from(query.subquery())
        ).scalar() or 0

        query = (
            query
            .offset((page - 1) * page_size)
            .limit(page_size)
            .order_by(Person.created_at.desc())
        )
        items = list(self.db.execute(query).scalars().all())
        return items, total

    def create(self, data: PersonCreate) -> Person:
        person = Person(**data.model_dump())
        self.db.add(person)
        self.db.flush()
        self.db.commit()
        self.db.refresh(person)
        logger.info("Person created: id=%s student_id=%s", person.id, person.student_id)
        return person

    def create_batch(self, persons_data: List[PersonCreate]) -> Tuple[int, int]:
        success_count = 0
        fail_count = 0
        valid_records: List[Person] = []

        for data in persons_data:
            if self.get_by_student_id(data.student_id):
                logger.warning("Batch import skipped duplicate student_id=%s", data.student_id)
                fail_count += 1
                continue
            valid_records.append(Person(**data.model_dump()))

        if valid_records:
            self.db.add_all(valid_records)
            self.db.flush()
            self.db.commit()
            success_count = len(valid_records)

        return success_count, fail_count

    def update(self, person_id: uuid.UUID, data: PersonUpdate) -> Optional[Person]:
        person = self.get_by_id(person_id)
        if person is None:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(person, key, value)
        self.db.flush()
        self.db.commit()
        self.db.refresh(person)
        logger.info("Person updated: id=%s", person_id)
        return person

    def delete(self, person_id: uuid.UUID) -> bool:
        person = self.get_by_id(person_id)
        if person is None:
            return False
        self.db.delete(person)
        self.db.flush()
        self.db.commit()
        logger.info("Person deleted: id=%s", person_id)
        return True

    def get_stats(self) -> dict:
        total = self.db.execute(
            select(func.count(Person.id))
        ).scalar() or 0

        student_count = self.db.execute(
            select(func.count(Person.id))
            .where(Person.role_type == "student")
        ).scalar() or 0

        teacher_count = self.db.execute(
            select(func.count(Person.id))
            .where(Person.role_type == "teacher")
        ).scalar() or 0

        face_registered_count = self.db.execute(
            select(func.count(Person.id))
            .where(Person.face_registered == True)
        ).scalar() or 0

        pending_count = total - face_registered_count
        completion_rate = _safe_div(face_registered_count, total)

        return {
            "total": total,
            "student_count": student_count,
            "teacher_count": teacher_count,
            "face_registered_count": face_registered_count,
            "face_pending_count": pending_count,
            "face_completion_rate": completion_rate,
            "attendance_rate": 0.0,
        }