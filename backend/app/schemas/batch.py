"""
Batch Pydantic schemas
"""
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel
from uuid import UUID


class BatchBase(BaseModel):
    batch_number: str
    source_type: Optional[str] = "采购入库"
    material_name: str
    material_code: Optional[str] = None
    production_date: Optional[date] = None
    quantity: Decimal
    unit: str = "吨"
    current_status: str = "待检"


class BatchCreate(BatchBase):
    pass


class BatchSchema(BatchBase):
    batch_id: UUID
    storage_start_date: Optional[datetime]
    create_time: datetime
    
    class Config:
        from_attributes = True


class BatchListResponse(BaseModel):
    items: List[BatchSchema]
    total: int
    page: int
    page_size: int
