"""
Dashboard API routes
"""
from datetime import datetime, date, timedelta
from typing import Optional, List
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.purchase_order import PurchaseOrder
from app.models.supplier import Supplier
from app.models.inventory import Inventory
from app.models.quality_inspection import QualityInspection
from app.schemas.dashboard import DashboardMetrics, OrderTrend, FulfillmentStatus, AlertItem, TodoItem

router = APIRouter(prefix="/dashboard", tags=["数据中台"])


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    total_orders = (await db.execute(select(func.count(PurchaseOrder.order_id)))).scalar() or 0
    pending_orders = (await db.execute(select(func.count(PurchaseOrder.order_id)).filter(PurchaseOrder.status.in_(["草稿", "已提交", "已确认"])))).scalar() or 0
    delivered_orders = (await db.execute(select(func.count(PurchaseOrder.order_id)).filter(PurchaseOrder.status.in_(["已到货", "已入库"])))).scalar() or 0
    total_amount = (await db.execute(select(func.sum(PurchaseOrder.total_amount)))).scalar() or Decimal("0")
    inventory_quantity = (await db.execute(select(func.sum(Inventory.quantity)))).scalar() or Decimal("0")
    inventory_value = (await db.execute(select(func.sum(Inventory.total_value)))).scalar() or Decimal("0")
    supplier_count = (await db.execute(select(func.count(Supplier.supplier_id)).filter(Supplier.status == "合作中"))).scalar() or 0
    inspection_pending = (await db.execute(select(func.count(QualityInspection.inspection_id)).filter(QualityInspection.status == "待检"))).scalar() or 0
    inspection_passed = (await db.execute(select(func.count(QualityInspection.inspection_id)).filter(QualityInspection.judgment_result == "合格")))).scalar() or 0
    
    return DashboardMetrics(
        total_orders=total_orders, pending_orders=pending_orders, delivered_orders=delivered_orders,
        total_amount=total_amount, inventory_quantity=inventory_quantity, inventory_value=inventory_value,
        supplier_count=supplier_count, inspection_pending=inspection_pending, inspection_passed=inspection_passed
    )


@router.get("/alerts", response_model=List[AlertItem])
async def get_alerts():
    return [
        AlertItem(id=1, type="inventory", title="高粱库存不足", description="原料库高粱库存低于安全库存", time="10分钟前", level="warning"),
        AlertItem(id=2, type="order", title="订单逾期提醒", description="PO-20250620-0003 已逾期3天", time="30分钟前", level="error"),
        AlertItem(id=3, type="inspection", title="质检异常", description="批次BATCH-20250618-0012 质检不合格", time="1小时前", level="error"),
        AlertItem(id=4, type="supplier", title="资质即将过期", description="四川川粮集团的营业执照将在30天后过期", time="2小时前", level="warning"),
    ]


@router.get("/todos", response_model=List[TodoItem])
async def get_todos():
    return [
        TodoItem(id=1, title="审批采购订单 PO-20250620-0005", category="采购订单", priority="urgent", time="今天"),
        TodoItem(id=2, title="完成高粱批次质检", category="质检任务", priority="pending", time="今天"),
        TodoItem(id=3, title="确认下周生产计划", category="生产计划", priority="normal", time="明天"),
        TodoItem(id=4, title="处理到货异常 PO-20250619-0002", category="采购订单", priority="pending", time="明天"),
    ]


@router.get("/fulfillment-status", response_model=List[FulfillmentStatus])
async def get_fulfillment_status(db: AsyncSession = Depends(get_db)):
    statuses = [("草稿", "草稿"), ("已提交", "已提交"), ("已确认", "已确认"), ("已发货", "已发货"), ("已到货", "已到货"), ("已入库", "已入库")]
    total = (await db.execute(select(func.count(PurchaseOrder.order_id)))).scalar() or 1
    result = []
    for db_status, display in statuses:
        count = (await db.execute(select(func.count(PurchaseOrder.order_id)).filter(PurchaseOrder.status == db_status))).scalar() or 0
        result.append(FulfillmentStatus(status=display, count=count, percentage=round(count / total * 100, 1)))
    return result


@router.get("/order-trends", response_model=List[OrderTrend])
async def get_order_trends(days: int = Query(7, ge=1, le=30), db: AsyncSession = Depends(get_db)):
    trends = []
    today = date.today()
    for i in range(days):
        target = today - timedelta(days=i)
        start = datetime.combine(target, datetime.min.time())
        end = datetime.combine(target, datetime.max.time())
        count = (await db.execute(select(func.count(PurchaseOrder.order_id)).filter(PurchaseOrder.created_at >= start, PurchaseOrder.created_at <= end))).scalar() or 0
        amount = (await db.execute(select(func.sum(PurchaseOrder.total_amount)).filter(PurchaseOrder.created_at >= start, PurchaseOrder.created_at <= end))).scalar() or Decimal("0")
        trends.append(OrderTrend(date=target, order_count=count, order_amount=amount))
    return list(reversed(trends))
