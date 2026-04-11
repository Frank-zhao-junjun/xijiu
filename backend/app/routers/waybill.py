"""
Waybill API routes
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.database import get_db
from app.models.waybill import Waybill
from app.schemas.waybill import WaybillSchema, WaybillListResponse

router = APIRouter(prefix="/waybills", tags=["物流运输"])


@router.get("", response_model=WaybillListResponse)
async def list_waybills(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Waybill)
    count_query = select(func.count(Waybill.waybill_id))
    
    if keyword:
        query = query.filter(Waybill.waybill_number.like(f"%{keyword}%"))
        count_query = count_query.filter(Waybill.waybill_number.like(f"%{keyword}%"))
    
    if status:
        query = query.filter(Waybill.status == status)
        count_query = count_query.filter(Waybill.status == status)
    
    total = (await db.execute(count_query)).scalar()
    query = query.order_by(Waybill.create_time.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return WaybillListResponse(items=[WaybillSchema.model_validate(i) for i in items], total=total or 0, page=page, page_size=page_size)


@router.get("/{waybill_id}", response_model=WaybillSchema)
async def get_waybill(waybill_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Waybill).filter(Waybill.waybill_id == waybill_id))
    waybill = result.scalar_one_or_none()
    if not waybill:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="运单不存在")
    return WaybillSchema.model_validate(waybill)
