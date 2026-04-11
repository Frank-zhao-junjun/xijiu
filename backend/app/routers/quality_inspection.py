"""
Quality Inspection API routes
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.database import get_db
from app.models.quality_inspection import QualityInspection, InspectionItem
from app.schemas.quality_inspection import QualityInspectionSchema, QualityInspectionListResponse, InspectionStats

router = APIRouter(prefix="/inspections", tags=["质检管理"])


@router.get("", response_model=QualityInspectionListResponse)
async def list_inspections(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(QualityInspection).options(selectinload(QualityInspection.inspection_items))
    count_query = select(func.count(QualityInspection.inspection_id))
    
    if keyword:
        query = query.filter(QualityInspection.inspection_number.like(f"%{keyword}%"))
        count_query = count_query.filter(QualityInspection.inspection_number.like(f"%{keyword}%"))
    
    if status:
        query = query.filter(QualityInspection.status == status)
        count_query = count_query.filter(QualityInspection.status == status)
    
    total = (await db.execute(count_query)).scalar()
    query = query.order_by(QualityInspection.create_time.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().unique().all()
    
    return QualityInspectionListResponse(items=[QualityInspectionSchema.model_validate(i) for i in items], total=total or 0, page=page, page_size=page_size)


@router.get("/stats", response_model=InspectionStats)
async def get_inspection_stats(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(QualityInspection.inspection_id)))).scalar() or 0
    pending = (await db.execute(select(func.count(QualityInspection.inspection_id)).filter(QualityInspection.status == "待检"))).scalar() or 0
    testing = (await db.execute(select(func.count(QualityInspection.inspection_id)).filter(QualityInspection.status == "检验中"))).scalar() or 0
    passed = (await db.execute(select(func.count(QualityInspection.inspection_id)).filter(QualityInspection.judgment_result == "合格"))).scalar() or 0
    failed = (await db.execute(select(func.count(QualityInspection.inspection_id)).filter(QualityInspection.judgment_result == "不合格"))).scalar() or 0
    
    return InspectionStats(total=total, pending=pending, testing=testing, passed=passed, failed=failed)
