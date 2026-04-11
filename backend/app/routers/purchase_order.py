"""
Purchase Order API routes
"""
from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.database import get_db
from app.models.purchase_order import PurchaseOrder, OrderLineItem, OrderStatusHistory
from app.models.supplier import Supplier
from app.schemas.purchase_order import PurchaseOrderSchema, PurchaseOrderCreate, PurchaseOrderListResponse, PurchaseOrderStats

router = APIRouter(prefix="/orders", tags=["采购订单"])


@router.get("", response_model=PurchaseOrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(PurchaseOrder).options(selectinload(PurchaseOrder.line_items), selectinload(PurchaseOrder.status_history))
    count_query = select(func.count(PurchaseOrder.order_id))
    
    if keyword:
        query = query.filter(or_(PurchaseOrder.order_number.like(f"%{keyword}%"), PurchaseOrder.created_by.like(f"%{keyword}%")))
        count_query = count_query.filter(or_(PurchaseOrder.order_number.like(f"%{keyword}%"), PurchaseOrder.created_by.like(f"%{keyword}%")))
    
    if status:
        query = query.filter(PurchaseOrder.status == status)
        count_query = count_query.filter(PurchaseOrder.status == status)
    
    total = (await db.execute(count_query)).scalar()
    query = query.order_by(PurchaseOrder.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().unique().all()
    
    return PurchaseOrderListResponse(items=[PurchaseOrderSchema.model_validate(i) for i in items], total=total or 0, page=page, page_size=page_size)


@router.get("/stats", response_model=PurchaseOrderStats)
async def get_order_stats(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(PurchaseOrder.order_id)))).scalar() or 0
    pending = (await db.execute(select(func.count(PurchaseOrder.order_id)).filter(PurchaseOrder.status == "已提交"))).scalar() or 0
    confirmed = (await db.execute(select(func.count(PurchaseOrder.order_id)).filter(PurchaseOrder.status == "已确认"))).scalar() or 0
    shipped = (await db.execute(select(func.count(PurchaseOrder.order_id)).filter(PurchaseOrder.status == "已发货"))).scalar() or 0
    delivered = (await db.execute(select(func.count(PurchaseOrder.order_id)).filter(PurchaseOrder.status.in_(["已到货", "已入库"])))).scalar() or 0
    total_amount = (await db.execute(select(func.sum(PurchaseOrder.total_amount)))).scalar() or Decimal("0")
    
    return PurchaseOrderStats(total=total, pending=pending, confirmed=confirmed, shipped=shipped, delivered=delivered, total_amount=total_amount)


@router.get("/{order_id}", response_model=PurchaseOrderSchema)
async def get_order(order_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.line_items), selectinload(PurchaseOrder.status_history))
        .filter(PurchaseOrder.order_id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return PurchaseOrderSchema.model_validate(order)


@router.post("", response_model=PurchaseOrderSchema, status_code=201)
async def create_order(order_data: PurchaseOrderCreate, db: AsyncSession = Depends(get_db)):
    order = PurchaseOrder(**order_data.model_dump(exclude={"line_items"}))
    count = (await db.execute(select(func.count(PurchaseOrder.order_id)))).scalar() or 0
    order.order_number = f"PO-{date.today().strftime('%Y%m%d')}-{str(count + 1).zfill(4)}"
    
    total = Decimal("0")
    for idx, item_data in enumerate(order_data.line_items):
        item = OrderLineItem(**item_data.model_dump(), line_number=idx + 1)
        if item.unit_price:
            item.subtotal = item.quantity * item.unit_price
            total += item.subtotal
        order.line_items.append(item)
    
    order.total_amount = total
    order.status_history.append(OrderStatusHistory(from_status=None, to_status="草稿", changed_by=order_data.created_by or "系统"))
    
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return PurchaseOrderSchema.model_validate(order)
