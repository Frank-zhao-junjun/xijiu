"""供应商API路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.supply_chain import Supplier
from app.schemas.supply_chain import SupplierCreate, SupplierUpdate, SupplierResponse

router = APIRouter(prefix="/suppliers", tags=["供应商管理"])

@router.get("/", response_model=List[SupplierResponse])
async def list_suppliers(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Supplier).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier: raise HTTPException(status_code=404, detail="供应商不存在")
    return supplier

@router.post("/", response_model=SupplierResponse, status_code=201)
async def create_supplier(supplier_data: SupplierCreate, db: AsyncSession = Depends(get_db)):
    supplier = Supplier(**supplier_data.model_dump())
    db.add(supplier)
    await db.flush()
    await db.refresh(supplier)
    return supplier

@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(supplier_id: int, supplier_data: SupplierUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier: raise HTTPException(status_code=404, detail="供应商不存在")
    for key, value in supplier_data.model_dump(exclude_unset=True).items():
        setattr(supplier, key, value)
    await db.flush()
    await db.refresh(supplier)
    return supplier

@router.delete("/{supplier_id}", status_code=204)
async def delete_supplier(supplier_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier: raise HTTPException(status_code=404, detail="供应商不存在")
    await db.delete(supplier)
    return None
