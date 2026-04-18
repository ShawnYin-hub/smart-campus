"""
人员档案路由（同步版本）
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user, CurrentUser, require_role, UserRole
from app.services.person_service import PersonService
from app.services.audit_service import AuditService
from app.schemas.person import (
    PersonCreate, PersonUpdate, PersonResponse,
    PersonListResponse, PersonStatsResponse, BatchImportRequest,
)

router = APIRouter(prefix="/persons", tags=["人员管理"])


@router.get("/stats", response_model=PersonStatsResponse, summary="获取人员统计")
def get_stats(
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return PersonService(db).get_stats()


@router.get("", response_model=PersonListResponse, summary="获取人员列表")
def list_persons(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str = Query(default=None),
    role_type: str = Query(default=None),
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = PersonService(db)
    items, total = service.list_paginated(page, page_size, search, role_type)
    stats = service.get_stats()

    return {
        "items": [
            {"id": str(p.id), "student_id": p.student_id, "name": p.name,
             "dept": p.dept, "role_type": p.role_type, "phone": p.phone,
             "face_registered": p.face_registered, "face_image_url": p.face_image_url,
             "device_id": p.device_id, "device_bind_time": p.device_bind_time,
             "created_at": p.created_at, "updated_at": p.updated_at}
            for p in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pending_face_count": stats["face_pending_count"],
    }


@router.post("", response_model=PersonResponse, status_code=status.HTTP_201_CREATED, summary="新增人员档案")
def create_person(
    request: Request,
    data: PersonCreate,
    current_user: CurrentUser = Depends(require_role(UserRole.ADMIN, UserRole.OPERATOR)),
    db: Session = Depends(get_db),
):
    service = PersonService(db)
    if service.get_by_student_id(data.student_id):
        raise HTTPException(status_code=400, detail=f"学号/工号 {data.student_id} 已存在")

    person = service.create(data)

    AuditService.log_sync(
        db=db,
        user_id=uuid.UUID(current_user.id),
        action="create_person",
        resource_type="person",
        resource_id=person.id,
        detail={"student_id": person.student_id, "name": person.name},
        ip_address=request.client.host if request.client else None,
    )

    return {
        "id": str(person.id), "student_id": person.student_id, "name": person.name,
        "dept": person.dept, "role_type": person.role_type, "phone": person.phone,
        "face_registered": person.face_registered, "face_image_url": person.face_image_url,
        "device_id": person.device_id, "device_bind_time": person.device_bind_time,
        "created_at": person.created_at, "updated_at": person.updated_at,
    }


@router.post("/batch", summary="批量导入人员档案")
def batch_import(
    request: Request,
    data: BatchImportRequest,
    current_user: CurrentUser = Depends(require_role(UserRole.ADMIN, UserRole.OPERATOR)),
    db: Session = Depends(get_db),
):
    service = PersonService(db)
    success, fail = service.create_batch(data.persons)

    AuditService.log_sync(
        db=db,
        user_id=uuid.UUID(current_user.id),
        action="batch_import_persons",
        resource_type="person",
        detail={"success": success, "fail": fail},
        ip_address=request.client.host if request.client else None,
    )

    return {"message": f"导入完成：成功 {success} 条，失败 {fail} 条", "success_count": success, "fail_count": fail}


@router.get("/{person_id}", response_model=PersonResponse, summary="获取人员详情")
def get_person(
    person_id: str,
    current_user: CurrentUser = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    person = PersonService(db).get_by_id(uuid.UUID(person_id))
    if person is None:
        raise HTTPException(status_code=404, detail="人员档案不存在")
    return {
        "id": str(person.id), "student_id": person.student_id, "name": person.name,
        "dept": person.dept, "role_type": person.role_type, "phone": person.phone,
        "face_registered": person.face_registered, "face_image_url": person.face_image_url,
        "device_id": person.device_id, "device_bind_time": person.device_bind_time,
        "created_at": person.created_at, "updated_at": person.updated_at,
    }


@router.put("/{person_id}", response_model=PersonResponse, summary="更新人员档案")
def update_person(
    request: Request,
    person_id: str,
    data: PersonUpdate,
    current_user: CurrentUser = Depends(require_role(UserRole.ADMIN, UserRole.OPERATOR)),
    db: Session = Depends(get_db),
):
    person = PersonService(db).update(uuid.UUID(person_id), data)
    if person is None:
        raise HTTPException(status_code=404, detail="人员档案不存在")

    AuditService.log_sync(
        db=db,
        user_id=uuid.UUID(current_user.id),
        action="update_person",
        resource_type="person",
        resource_id=person.id,
        ip_address=request.client.host if request.client else None,
    )

    return {
        "id": str(person.id), "student_id": person.student_id, "name": person.name,
        "dept": person.dept, "role_type": person.role_type, "phone": person.phone,
        "face_registered": person.face_registered, "face_image_url": person.face_image_url,
        "device_id": person.device_id, "device_bind_time": person.device_bind_time,
        "created_at": person.created_at, "updated_at": person.updated_at,
    }


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT, summary="删除人员档案")
def delete_person(
    request: Request,
    person_id: str,
    current_user: CurrentUser = Depends(require_role(UserRole.ADMIN, UserRole.OPERATOR)),
    db: Session = Depends(get_db),
):
    if not PersonService(db).delete(uuid.UUID(person_id)):
        raise HTTPException(status_code=404, detail="人员档案不存在")

    AuditService.log_sync(
        db=db,
        user_id=uuid.UUID(current_user.id),
        action="delete_person",
        resource_type="person",
        resource_id=uuid.UUID(person_id),
        ip_address=request.client.host if request.client else None,
    )
