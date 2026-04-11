"""
Supplier Pydantic schemas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import UUID


class SupplierBase(BaseModel):
    name: str = Field(..., description="供应商名称")
    type: str = Field(..., description="类型")
    category: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    address: Optional[dict] = {}
    status: str = "待审核"
    credit_level: str = "C"


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None


class SupplierSchema(SupplierBase):
    supplier_id: UUID
    supplier_code: str
    create_time: datetime
    
    class Config:
        from_attributes = True


class SupplierListResponse(BaseModel):
    items: List[SupplierSchema]
    total: int
    page: int
    page_size: int


class SupplierStats(BaseModel):
    total: int
    active: int
    pending: int
    suspended: int
