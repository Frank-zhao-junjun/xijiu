"""生产记录API路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.supply_chain import ProductionRecord, Product, MaterialUsage
from app.schemas.supply_chain import ProductionRecordCreate, ProductionRecordResponse

router = APIRouter(prefix="/production", tags=["生产管理"])

@router.get("/records", response_model=List[ProductionRecordResponse])
async def list_production_records(skip: int = 0, limit: int = 100, product_id: int = None, db: AsyncSession = Depends(get_db)):
    query = select(ProductionRecord).options(selectinload(ProductionRecord.material_usages))
    if product_id: query = query.where(ProductionRecord.product_id == product_id)
    result = await db.execute(query.offset(skip).limit(limit).order_by(ProductionRecord.production_date.desc()))
    return result.scalars().all()

@router.get("/records/{record_id}", response_model=ProductionRecordResponse)
async def get_production_record(record_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProductionRecord).options(selectinload(ProductionRecord.material_usages)).where(ProductionRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record: raise HTTPException(status_code=404, detail="生产记录不存在")
    return record

@router.post("/records", response_model=ProductionRecordResponse, status_code=201)
async def create_production_record(record_data: ProductionRecordCreate, db: AsyncSession = Depends(get_db)):
    product_result = await db.execute(select(Product).where(Product.id == record_data.product_id))
    product = product_result.scalar_one_or_none()
    if not product: raise HTTPException(status_code=404, detail="产品不存在")
    quality_rate = (record_data.qualified_quantity / record_data.quantity * 100) if record_data.quantity > 0 else 0
    record = ProductionRecord(product_id=record_data.product_id, batch_no=record_data.batch_no, quantity=record_data.quantity, qualified_quantity=record_data.qualified_quantity, quality_rate=quality_rate, operator=record_data.operator, notes=record_data.notes)
    db.add(record)
    await db.flush()
    for usage in record_data.material_usages:
        db.add(MaterialUsage(production_record_id=record.id, material_name=usage.material_name, quantity=usage.quantity))
    product.stock_quantity += record_data.qualified_quantity
    await db.flush()
    result = await db.execute(select(ProductionRecord).options(selectinload(ProductionRecord.material_usages)).where(ProductionRecord.id == record.id))
    return result.scalar_one()

@router.get("/today-stats")
async def get_today_production_stats(db: AsyncSession = Depends(get_db)):
    today = datetime.now().date()
    result = await db.execute(select(ProductionRecord).where(ProductionRecord.production_date >= datetime.combine(today, datetime.min.time())))
    records = result.scalars().all()
    total_quantity = sum(r.quantity for r in records)
    total_qualified = sum(r.qualified_quantity for r in records)
    return {"production_count": len(records), "total_quantity": total_quantity, "total_qualified": total_qualified, "avg_quality_rate": (total_qualified / total_quantity * 100) if total_quantity > 0 else 0}
