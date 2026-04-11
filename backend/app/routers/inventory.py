"""
Inventory API routes
"""
from datetime import datetime
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.models.inventory import Inventory, InventoryAlert
from app.schemas.inventory import InventorySchema, InventoryCreate, InventoryListResponse, InventoryStats

router = APIRouter(prefix="/inventory", tags=["库存管理"])


@router.get("", response_model=InventoryListResponse)
async def list_inventory(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Inventory)
    count_query = select(func.count(Inventory.inventory_id))
    
    if keyword:
        query = query.filter(Inventory.material_name.like(f"%{keyword}%"))
        count_query = count_query.filter(Inventory.material_name.like(f"%{keyword}%"))
    
    if status:
        query = query.filter(Inventory.status == status)
        count_query = count_query.filter(Inventory.status == status)
    
    total = (await db.execute(count_query)).scalar()
    query = query.order_by(Inventory.material_name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return InventoryListResponse(items=[InventorySchema.model_validate(i) for i in items], total=total or 0, page=page, page_size=page_size)


@router.get("/stats", response_model=InventoryStats)
async def get_inventory_stats(db: AsyncSession = Depends(get_db)):
    total_qty = (await db.execute(select(func.sum(Inventory.quantity)))).scalar() or Decimal("0")
    total_value = (await db.execute(select(func.sum(Inventory.total_value)))).scalar() or Decimal("0")
    normal = (await db.execute(select(func.count(Inventory.inventory_id)).filter(Inventory.status == "正常"))).scalar() or 0
    warning = (await db.execute(select(func.count(Inventory.inventory_id)).filter(Inventory.status == "预警"))).scalar() or 0
    alert = (await db.execute(select(func.count(Inventory.inventory_id)).filter(Inventory.status.in_(["不足", "超储", "冻结"])))).scalar() or 0
    types = (await db.execute(select(func.count(func.distinct(Inventory.material_id))))).scalar() or 0
    
    return InventoryStats(total_quantity=total_qty, total_value=total_value, normal_count=normal, warning_count=warning, alert_count=alert, material_types=types)


@router.get("/alerts")
async def get_alerts(limit: int = Query(10, ge=1, le=50), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InventoryAlert).order_by(InventoryAlert.create_time.desc()).limit(limit))
    return result.scalars().all()
