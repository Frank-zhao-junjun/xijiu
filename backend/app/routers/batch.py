"""
Batch API routes
"""
from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.models.batch import Batch
from app.schemas.batch import BatchSchema, BatchListResponse

router = APIRouter(prefix="/batches", tags=["批次管理"])


@router.get("", response_model=BatchListResponse)
async def list_batches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Batch)
    count_query = select(func.count(Batch.batch_id))
    
    if keyword:
        query = query.filter(Batch.batch_number.like(f"%{keyword}%"))
        count_query = count_query.filter(Batch.batch_number.like(f"%{keyword}%"))
    
    if status:
        query = query.filter(Batch.current_status == status)
        count_query = count_query.filter(Batch.current_status == status)
    
    total = (await db.execute(count_query)).scalar()
    query = query.order_by(Batch.create_time.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return BatchListResponse(items=[BatchSchema.model_validate(i) for i in items], total=total or 0, page=page, page_size=page_size)


@router.get("/{batch_id}", response_model=BatchSchema)
async def get_batch(batch_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Batch).filter(Batch.batch_id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="批次不存在")
    return BatchSchema.model_validate(batch)
