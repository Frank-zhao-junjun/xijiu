"""
Waybill Pydantic schemas
"""
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel
from uuid import UUID


class WaybillBase(BaseModel):
    waybill_number: str
    order_id: Optional[UUID] = None
    order_number: Optional[str] = None
    carrier_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    status: str = "待发货"


class WaybillSchema(WaybillBase):
    waybill_id: UUID
    supplier_id: Optional[UUID] = None
    cargo_type: Optional[str] = None
    total_quantity: Optional[Decimal] = None
    departure_time: Optional[datetime] = None
    actual_arrival_time: Optional[datetime] = None
    create_time: datetime
    
    class Config:
        from_attributes = True


class WaybillListResponse(BaseModel):
    items: List[WaybillSchema]
    total: int
    page: int
    page_size: int
