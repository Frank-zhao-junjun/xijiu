"""采购订单API路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime
import uuid
from app.core.database import get_db
from app.models.supply_chain import PurchaseOrder, PurchaseOrderItem, Material, OrderStatus
from app.schemas.supply_chain import PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse

router = APIRouter(prefix="/purchase-orders", tags=["采购订单"])

def generate_order_no():
    return f"PO{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"

@router.get("/", response_model=List[PurchaseOrderResponse])
async def list_purchase_orders(skip: int = 0, limit: int = 100, status: str = None, supplier_id: int = None, db: AsyncSession = Depends(get_db)):
    query = select(PurchaseOrder).options(selectinload(PurchaseOrder.items))
    if status: query = query.where(PurchaseOrder.status == status)
    if supplier_id: query = query.where(PurchaseOrder.supplier_id == supplier_id)
    result = await db.execute(query.offset(skip).limit(limit).order_by(PurchaseOrder.created_at.desc()))
    return result.scalars().all()

@router.get("/{order_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PurchaseOrder).options(selectinload(PurchaseOrder.items)).where(PurchaseOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="订单不存在")
    return order

@router.post("/", response_model=PurchaseOrderResponse, status_code=201)
async def create_purchase_order(order_data: PurchaseOrderCreate, db: AsyncSession = Depends(get_db)):
    total_amount = sum(item.subtotal for item in order_data.items)
    order = PurchaseOrder(order_no=generate_order_no(), supplier_id=order_data.supplier_id, total_amount=total_amount, expected_delivery_date=order_data.expected_delivery_date, notes=order_data.notes)
    db.add(order)
    await db.flush()
    for item in order_data.items:
        db.add(PurchaseOrderItem(purchase_order_id=order.id, material_id=item.material_id, quantity=item.quantity, unit_price=item.unit_price, subtotal=item.subtotal))
    await db.flush()
    result = await db.execute(select(PurchaseOrder).options(selectinload(PurchaseOrder.items)).where(PurchaseOrder.id == order.id))
    return result.scalar_one()

@router.put("/{order_id}", response_model=PurchaseOrderResponse)
async def update_purchase_order(order_id: int, order_data: PurchaseOrderUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PurchaseOrder).options(selectinload(PurchaseOrder.items)).where(PurchaseOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="订单不存在")
    update_data = order_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(order, key, value)
    if order_data.status == "delivered" and order.actual_delivery_date is None:
        order.actual_delivery_date = datetime.utcnow()
        for item in order.items:
            mat_result = await db.execute(select(Material).where(Material.id == item.material_id))
            material = mat_result.scalar_one_or_none()
            if material: material.stock_quantity += item.quantity
    await db.flush()
    await db.refresh(order)
    return order

@router.delete("/{order_id}", status_code=204)
async def delete_purchase_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="订单不存在")
    await db.delete(order)
    return None


@router.post("/{order_id}/supplier-confirm", response_model=PurchaseOrderResponse)
async def supplier_confirm_order(order_id: int, db: AsyncSession = Depends(get_db)):
    """US-303-2：供应商确认订单"""
    result = await db.execute(select(PurchaseOrder).options(selectinload(PurchaseOrder.items)).where(PurchaseOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    order.status = OrderStatus.CONFIRMED
    order.supplier_confirmed_at = datetime.utcnow()
    order.supplier_rejection_reason = None
    await db.flush()
    await db.refresh(order)
    return order


@router.post("/{order_id}/supplier-reject", response_model=PurchaseOrderResponse)
async def supplier_reject_order(
    order_id: int,
    reason: str = Query(..., description="拒绝原因"),
    db: AsyncSession = Depends(get_db),
):
    """US-303-2：供应商拒绝订单"""
    result = await db.execute(select(PurchaseOrder).options(selectinload(PurchaseOrder.items)).where(PurchaseOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    order.status = OrderStatus.CANCELLED
    order.supplier_rejection_reason = reason
    await db.flush()
    await db.refresh(order)
    return order


@router.post("/{order_id}/supplier-objection", response_model=PurchaseOrderResponse)
async def supplier_objection_order(
    order_id: int,
    note: str = Query(..., description="异议说明"),
    db: AsyncSession = Depends(get_db),
):
    """US-303-2：供应商提出异议（保持待处理，由采购方跟进）"""
    result = await db.execute(select(PurchaseOrder).options(selectinload(PurchaseOrder.items)).where(PurchaseOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    prefix = (order.notes or "").strip()
    tag = f"\n[供应商异议 {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] {note}"
    order.notes = (prefix + tag).strip()
    await db.flush()
    await db.refresh(order)
    return order
