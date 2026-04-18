"""
Tests for approval management service.
"""
from __future__ import annotations

import pytest
from app.services.approval_service import ApprovalService, _safe_div
from app.schemas.approval import ApprovalCreate


class TestSafeDiv:
    def test_normal_division(self):
        assert _safe_div(75, 100) == 75.0

    def test_zero_denominator(self):
        assert _safe_div(10, 0) == 0.0

    def test_zero_numerator(self):
        assert _safe_div(0, 100) == 0.0

    def test_custom_default(self):
        assert _safe_div(10, 0, default=50.0) == 50.0


class TestApprovalService:
    def test_create_approval(self, db_session, test_person, admin_user):
        service = ApprovalService(db_session)
        data = ApprovalCreate(
            person_id=str(test_person.id),
            type="leave_school",
            reason="Family emergency",
        )
        approval = service.create(data, risk_level="high", alert=True)
        assert approval.id is not None
        assert approval.status == "pending"
        assert approval.risk_level == "high"
        assert approval.alert is True

    def test_approve_approval(self, db_session, test_person, admin_user):
        service = ApprovalService(db_session)
        data = ApprovalCreate(person_id=str(test_person.id), type="leave_school", reason="Test")
        approval = service.create(data)
        result = service.approve(approval.id, admin_user.id, comment="Approved")
        assert result is not None
        assert result.status == "approved"
        assert result.reviewed_by == admin_user.id

    def test_reject_approval(self, db_session, test_person, admin_user):
        service = ApprovalService(db_session)
        data = ApprovalCreate(person_id=str(test_person.id), type="leave_school", reason="Test")
        approval = service.create(data)
        result = service.reject(approval.id, admin_user.id, comment="Rejected")
        assert result is not None
        assert result.status == "rejected"

    def test_cannot_approve_already_approved(self, db_session, test_person, admin_user):
        service = ApprovalService(db_session)
        data = ApprovalCreate(person_id=str(test_person.id), type="leave_school", reason="Test")
        approval = service.create(data)
        first = service.approve(approval.id, admin_user.id)
        assert first is not None
        assert first.status == "approved"
        # Second call returns None (already processed)
        second = service.approve(approval.id, admin_user.id)
        assert second is None

    def test_get_stats(self, db_session, test_person, admin_user):
        service = ApprovalService(db_session)
        stats = service.get_stats()
        assert "pending_count" in stats
        assert "today_processed" in stats
        assert "compliance_rate" in stats
        assert isinstance(stats["compliance_rate"], float)

    def test_list_paginated(self, db_session, test_person):
        service = ApprovalService(db_session)
        data = ApprovalCreate(person_id=str(test_person.id), type="leave_school", reason="Test")
        service.create(data)
        items, total = service.list_paginated(page=1, page_size=10)
        assert total >= 1
        assert len(items) >= 1

    def test_list_filtered_by_status(self, db_session, test_person, admin_user):
        service = ApprovalService(db_session)
        service.create(
            ApprovalCreate(person_id=str(test_person.id), type="leave_school", reason="Test")
        )
        pending_items, pending_total = service.list_paginated(status="pending")
        assert pending_total >= 1
        approved_items, _ = service.list_paginated(status="approved")
        assert all(a.status == "approved" for a in approved_items)
