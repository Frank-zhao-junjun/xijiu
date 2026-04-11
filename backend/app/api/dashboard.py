"""仪表盘API路由"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.supply_chain import Product, Supplier, PurchaseOrder, SalesOrder, Material, ProductionRecord
from app.schemas.supply_chain import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    product_count = (await db.execute(select(func.count(Product.id)))).scalar()
    supplier_count = (await db.execute(select(func.count(Supplier.id)))).scalar()
    po_count = (await db.execute(select(func.count(PurchaseOrder.id)))).scalar()
    revenue_result = await db.execute(select(func.coalesce(func.sum(SalesOrder.total_amount), 0)).where(SalesOrder.status == "delivered"))
    total_revenue = revenue_result.scalar()
    pending_result = (await db.execute(select(func.count(PurchaseOrder.id)).where(PurchaseOrder.status == "pending"))).scalar()
    low_stock_result = (await db.execute(select(func.count(Material.id)).where(Material.stock_quantity <= Material.reorder_point))).scalar()
    today = datetime.now().date()
    production_result = await db.execute(select(func.coalesce(func.sum(ProductionRecord.qualified_quantity), 0)).where(ProductionRecord.production_date >= datetime.combine(today, datetime.min.time())))
    production_today = production_result.scalar()
    return DashboardStats(total_products=product_count or 0, total_suppliers=supplier_count or 0, total_orders=po_count or 0, total_revenue=total_revenue or 0.0, pending_orders=pending_result or 0, low_stock_materials=low_stock_result or 0, production_today=production_today or 0)

@router.get("/sales-summary")
async def get_sales_summary(days: int = 7, db: AsyncSession = Depends(get_db)):
    start_date = datetime.now() - timedelta(days=days)
    result = await db.execute(select(SalesOrder).where(SalesOrder.created_at >= start_date).order_by(SalesOrder.created_at.desc()))
    orders = result.scalars().all()
    total_orders = len(orders)
    total_amount = sum(o.total_amount for o in orders)
    avg_order_value = total_amount / total_orders if total_orders > 0 else 0
    return {"period_days": days, "total_orders": total_orders, "total_amount": total_amount, "avg_order_value": avg_order_value}

@router.get("/inventory-alerts")
async def get_inventory_alerts(db: AsyncSession = Depends(get_db)):
    low_stock_materials = (await db.execute(select(Material).where(Material.stock_quantity <= Material.reorder_point))).scalars().all()
    low_stock_products = (await db.execute(select(Product).where(Product.stock_quantity < 100))).scalars().all()
    return {"low_stock_materials": [{"id": m.id, "name": m.name, "stock_quantity": m.stock_quantity, "reorder_point": m.reorder_point, "unit": m.unit} for m in low_stock_materials], "low_stock_products": [{"id": p.id, "name": p.name, "stock_quantity": p.stock_quantity, "category": p.category} for p in low_stock_products]}
