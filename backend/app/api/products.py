"""产品API路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.supply_chain import Product
from app.schemas.supply_chain import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/products", tags=["产品管理"])

@router.get("/", response_model=List[ProductResponse])
async def list_products(skip: int = 0, limit: int = 100, category: str = None, brand: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Product)
    if category: query = query.where(Product.category == category)
    if brand: query = query.where(Product.brand == brand)
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product.category).distinct().where(Product.category.isnot(None)))
    return [row[0] for row in result.all()]

@router.get("/brands")
async def get_brands(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product.brand).distinct().where(Product.brand.isnot(None)))
    return [row[0] for row in result.all()]

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product: raise HTTPException(status_code=404, detail="产品不存在")
    return product

@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(product_data: ProductCreate, db: AsyncSession = Depends(get_db)):
    product = Product(**product_data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product_data: ProductUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product: raise HTTPException(status_code=404, detail="产品不存在")
    for key, value in product_data.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    await db.flush()
    await db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product: raise HTTPException(status_code=404, detail="产品不存在")
    await db.delete(product)
    return None
