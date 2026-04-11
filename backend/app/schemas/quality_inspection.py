"""
Quality Inspection Pydantic schemas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID


class InspectionItemSchema(BaseModel):
    item_id: UUID
    inspection_id: UUID
    item_name: str
    item_category: Optional[str] = None
    standard_value: Optional[str] = None
    actual_value: Optional[str] = None
    is_passed: Optional[bool] = None
    unit: Optional[str] = None
    
    class Config:
        from_attributes = True


class QualityInspectionSchema(BaseModel):
    inspection_id: UUID
    inspection_number: str
    batch_id: UUID
    batch_number: Optional[str] = None
    material_name: Optional[str] = None
    inspection_type: Optional[str] = None
    sample_size: Optional[int] = None
    inspector: Optional[str] = None
    status: str
    judgment_result: Optional[str] = None
    judgment_by: Optional[str] = None
    judgment_time: Optional[datetime] = None
    create_time: datetime
    inspection_items: List[InspectionItemSchema] = []
    
    class Config:
        from_attributes = True


class QualityInspectionListResponse(BaseModel):
    items: List[QualityInspectionSchema]
    total: int
    page: int
    page_size: int


class InspectionStats(BaseModel):
    total: int
    pending: int
    testing: int
    passed: int
    failed: int
