"""销售订单API路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import uuid
from app.core.database import get_db
from app.models.supply_chain import SalesOrder, Product
from app.schemas.supply_chain import SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse

router = APIRouter(prefix="/sales-orders", tags=["销售订单"])

def generate_sales_order_no():
    return f"SO{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"

@router.get("/", response_model=List[SalesOrderResponse])
async def list_sales_orders(skip: int = 0, limit: int = 100, status: str = None, product_id: int = None, db: AsyncSession = Depends(get_db)):
    query = select(SalesOrder)
    if status: query = query.where(SalesOrder.status == status)
    if product_id: query = query.where(SalesOrder.product_id == product_id)
    result = await db.execute(query.offset(skip).limit(limit).order_by(SalesOrder.created_at.desc()))
    return result.scalars().all()

@router.get("/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SalesOrder).where(SalesOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="订单不存在")
    return order

@router.post("/", response_model=SalesOrderResponse, status_code=201)
async def create_sales_order(order_data: SalesOrderCreate, db: AsyncSession = Depends(get_db)):
    product_result = await db.execute(select(Product).where(Product.id == order_data.product_id))
    product = product_result.scalar_one_or_none()
    if not product: raise HTTPException(status_code=404, detail="产品不存在")
    if product.stock_quantity < order_data.quantity:
        raise HTTPException(status_code=400, detail=f"库存不足，当前库存: {product.stock_quantity}，订单数量: {order_data.quantity}")
    total_amount = order_data.quantity * order_data.unit_price
    order = SalesOrder(order_no=generate_sales_order_no(), product_id=order_data.product_id, customer_name=order_data.customer_name, customer_contact=order_data.customer_contact, quantity=order_data.quantity, unit_price=order_data.unit_price, total_amount=total_amount, shipping_address=order_data.shipping_address, expected_ship_date=order_data.expected_ship_date, notes=order_data.notes)
    db.add(order)
    await db.flush()
    await db.refresh(order)
    return order

@router.put("/{order_id}", response_model=SalesOrderResponse)
async def update_sales_order(order_id: int, order_data: SalesOrderUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SalesOrder).where(SalesOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="订单不存在")
    if order_data.status == "shipped" and order.status != "shipped":
        product_result = await db.execute(select(Product).where(Product.id == order.product_id))
        product = product_result.scalar_one_or_none()
        if product and product.stock_quantity >= order.quantity:
            product.stock_quantity -= order.quantity
            order.actual_ship_date = datetime.utcnow()
        else:
            raise HTTPException(status_code=400, detail="库存不足，无法发货")
    for key, value in order_data.model_dump(exclude_unset=True).items():
        setattr(order, key, value)
    await db.flush()
    await db.refresh(order)
    return order

@router.delete("/{order_id}", status_code=204)
async def delete_sales_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SalesOrder).where(SalesOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="订单不存在")
    await db.delete(order)
    return None
