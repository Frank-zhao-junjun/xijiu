"""原材料API路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.supply_chain import Material
from app.schemas.supply_chain import MaterialCreate, MaterialUpdate, MaterialResponse

router = APIRouter(prefix="/materials", tags=["原材料管理"])

@router.get("/", response_model=List[MaterialResponse])
async def list_materials(skip: int = 0, limit: int = 100, category: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Material)
    if category: query = query.where(Material.category == category)
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/low-stock")
async def get_low_stock_materials(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Material).where(Material.stock_quantity <= Material.reorder_point))
    return result.scalars().all()

@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(material_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material: raise HTTPException(status_code=404, detail="原材料不存在")
    return material

@router.post("/", response_model=MaterialResponse, status_code=201)
async def create_material(material_data: MaterialCreate, db: AsyncSession = Depends(get_db)):
    material = Material(**material_data.model_dump())
    db.add(material)
    await db.flush()
    await db.refresh(material)
    return material

@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material(material_id: int, material_data: MaterialUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material: raise HTTPException(status_code=404, detail="原材料不存在")
    for key, value in material_data.model_dump(exclude_unset=True).items():
        setattr(material, key, value)
    await db.flush()
    await db.refresh(material)
    return material

@router.delete("/{material_id}", status_code=204)
async def delete_material(material_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material: raise HTTPException(status_code=404, detail="原材料不存在")
    await db.delete(material)
    return None
