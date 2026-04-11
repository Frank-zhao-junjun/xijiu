"""
Inventory Pydantic schemas
"""
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel
from uuid import UUID


class InventoryBase(BaseModel):
    material_id: UUID
    material_name: str
    material_code: Optional[str] = None
    storage_location_id: UUID
    quantity: Decimal = Decimal("0")
    available_quantity: Decimal = Decimal("0")
    unit: str = "吨"
    status: str = "正常"


class InventoryCreate(InventoryBase):
    pass


class InventorySchema(InventoryBase):
    inventory_id: UUID
    frozen_quantity: Decimal = Decimal("0")
    locked_quantity: Decimal = Decimal("0")
    safe_stock: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    total_value: Optional[Decimal] = None
    create_time: datetime
    
    class Config:
        from_attributes = True


class InventoryListResponse(BaseModel):
    items: List[InventorySchema]
    total: int
    page: int
    page_size: int


class InventoryStats(BaseModel):
    total_quantity: Decimal
    total_value: Decimal
    normal_count: int
    warning_count: int
    alert_count: int
    material_types: int
