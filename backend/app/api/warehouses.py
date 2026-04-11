"""仓库API路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.supply_chain import Warehouse
from app.schemas.supply_chain import WarehouseCreate, WarehouseUpdate, WarehouseResponse

router = APIRouter(prefix="/warehouses", tags=["仓库管理"])

@router.get("/", response_model=List[WarehouseResponse])
async def list_warehouses(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Warehouse).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(warehouse_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
    warehouse = result.scalar_one_or_none()
    if not warehouse: raise HTTPException(status_code=404, detail="仓库不存在")
    return warehouse

@router.post("/", response_model=WarehouseResponse, status_code=201)
async def create_warehouse(warehouse_data: WarehouseCreate, db: AsyncSession = Depends(get_db)):
    warehouse = Warehouse(**warehouse_data.model_dump())
    db.add(warehouse)
    await db.flush()
    await db.refresh(warehouse)
    return warehouse

@router.put("/{warehouse_id}", response_model=WarehouseResponse)
async def update_warehouse(warehouse_id: int, warehouse_data: WarehouseUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
    warehouse = result.scalar_one_or_none()
    if not warehouse: raise HTTPException(status_code=404, detail="仓库不存在")
    for key, value in warehouse_data.model_dump(exclude_unset=True).items():
        setattr(warehouse, key, value)
    await db.flush()
    await db.refresh(warehouse)
    return warehouse

@router.delete("/{warehouse_id}", status_code=204)
async def delete_warehouse(warehouse_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
    warehouse = result.scalar_one_or_none()
    if not warehouse: raise HTTPException(status_code=404, detail="仓库不存在")
    await db.delete(warehouse)
    return None
