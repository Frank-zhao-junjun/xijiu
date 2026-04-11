"""
Supplier API routes
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierSchema, SupplierCreate, SupplierUpdate, SupplierListResponse, SupplierStats

router = APIRouter(prefix="/suppliers", tags=["供应商管理"])


@router.get("", response_model=SupplierListResponse)
async def list_suppliers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Supplier)
    count_query = select(func.count(Supplier.supplier_id))
    
    if keyword:
        query = query.filter(or_(Supplier.name.like(f"%{keyword}%"), Supplier.supplier_code.like(f"%{keyword}%")))
        count_query = count_query.filter(or_(Supplier.name.like(f"%{keyword}%"), Supplier.supplier_code.like(f"%{keyword}%")))
    
    if status:
        query = query.filter(Supplier.status == status)
        count_query = count_query.filter(Supplier.status == status)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return SupplierListResponse(items=[SupplierSchema.model_validate(i) for i in items], total=total or 0, page=page, page_size=page_size)


@router.get("/stats", response_model=SupplierStats)
async def get_supplier_stats(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(Supplier.supplier_id)))).scalar() or 0
    active = (await db.execute(select(func.count(Supplier.supplier_id)).filter(Supplier.status == "合作中"))).scalar() or 0
    pending = (await db.execute(select(func.count(Supplier.supplier_id)).filter(Supplier.status == "待审核"))).scalar() or 0
    suspended = (await db.execute(select(func.count(Supplier.supplier_id)).filter(Supplier.status == "暂停"))).scalar() or 0
    return SupplierStats(total=total, active=active, pending=pending, suspended=suspended)


@router.get("/{supplier_id}", response_model=SupplierSchema)
async def get_supplier(supplier_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Supplier).filter(Supplier.supplier_id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    return SupplierSchema.model_validate(supplier)


@router.post("", response_model=SupplierSchema, status_code=201)
async def create_supplier(supplier_data: SupplierCreate, db: AsyncSession = Depends(get_db)):
    supplier = Supplier(**supplier_data.model_dump())
    if not supplier.supplier_code:
        count = (await db.execute(select(func.count(Supplier.supplier_id))).scalar()) or 0
        supplier.supplier_code = f"SUP{str(count + 1).zfill(6)}"
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return SupplierSchema.model_validate(supplier)
