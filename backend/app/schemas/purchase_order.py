"""
Purchase Order Pydantic schemas
"""
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel
from uuid import UUID


class OrderLineItemSchema(BaseModel):
    line_id: UUID
    order_id: UUID
    material_name: str
    material_code: Optional[str] = None
    specification: Optional[str] = None
    quantity: Decimal
    unit: str = "吨"
    unit_price: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None
    delivery_date: Optional[date] = None
    actual_delivered_qty: Decimal = Decimal("0")
    arrived_qty: Decimal = Decimal("0")
    accepted_qty: Decimal = Decimal("0")
    line_number: int
    
    class Config:
        from_attributes = True


class OrderLineItemCreate(BaseModel):
    material_name: str
    material_code: Optional[str] = None
    specification: Optional[str] = None
    quantity: Decimal
    unit: str = "吨"
    unit_price: Optional[Decimal] = None
    delivery_date: Optional[date] = None


class OrderStatusHistorySchema(BaseModel):
    history_id: UUID
    from_status: Optional[str]
    to_status: str
    change_time: datetime
    changed_by: Optional[str]
    reason: Optional[str]
    
    class Config:
        from_attributes = True


class PurchaseOrderSchema(BaseModel):
    order_id: UUID
    order_number: str
    supplier_id: UUID
    plan_type: Optional[str] = None
    season_tag: Optional[str] = None
    total_amount: Decimal
    currency: str = "CNY"
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    status: str
    created_by: Optional[str]
    created_at: datetime
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    line_items: List[OrderLineItemSchema] = []
    status_history: List[OrderStatusHistorySchema] = []
    
    class Config:
        from_attributes = True


class PurchaseOrderCreate(BaseModel):
    supplier_id: UUID
    plan_type: Optional[str] = "月度计划"
    season_tag: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    created_by: Optional[str] = "系统"
    remarks: Optional[str] = None
    line_items: List[OrderLineItemCreate] = []


class PurchaseOrderListResponse(BaseModel):
    items: List[PurchaseOrderSchema]
    total: int
    page: int
    page_size: int


class PurchaseOrderStats(BaseModel):
    total: int
    pending: int
    confirmed: int
    shipped: int
    delivered: int
    total_amount: Decimal
