"""
Quality Inspection models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class QualityInspection(Base):
    __tablename__ = "quality_inspection"
    
    inspection_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_number = Column(String(50), unique=True, nullable=False)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batch.batch_id"), nullable=False)
    batch_number = Column(String(50))
    material_name = Column(String(200))
    material_code = Column(String(50))
    inspection_type = Column(String(30))
    sample_size = Column(Integer)
    sample_code = Column(String(50))
    sampling_location = Column(String(200))
    sampling_time = Column(DateTime)
    inspector = Column(String(100))
    inspector_assist = Column(String(100))
    status = Column(String(20), default="待检")
    judgment_result = Column(String(20))
    judgment_by = Column(String(100))
    judgment_time = Column(DateTime)
    judgment_remarks = Column(Text)
    reject_reason = Column(Text)
    conclusion = Column(Text)
    report_url = Column(String(500))
    create_time = Column(DateTime, default=datetime.utcnow)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    batch = relationship("Batch", back_populates="quality_inspections")
    inspection_items = relationship("InspectionItem", back_populates="inspection", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("idx_inspection_number", "inspection_number"),
        Index("idx_inspection_batch", "batch_id"),
    )


class InspectionItem(Base):
    __tablename__ = "inspection_item"
    
    item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_id = Column(UUID(as_uuid=True), ForeignKey("quality_inspection.inspection_id"), nullable=False)
    item_name = Column(String(100), nullable=False)
    item_category = Column(String(30))
    standard_code = Column(String(50))
    standard_value = Column(String(100))
    test_method = Column(String(200))
    unit = Column(String(20))
    actual_value = Column(String(100))
    is_passed = Column(Boolean)
    deviation = Column(String(50))
    test_equipment = Column(String(100))
    test_time = Column(DateTime)
    line_number = Column(Integer)
    
    inspection = relationship("QualityInspection", back_populates="inspection_items")
    
    __table_args__ = (Index("idx_item_inspection", "inspection_id"),)
