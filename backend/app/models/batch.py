"""
Batch models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Date, Numeric, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Batch(Base):
    __tablename__ = "batch"
    
    batch_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_number = Column(String(50), unique=True, nullable=False)
    source_type = Column(String(30))
    source_order_id = Column(String(36))
    material_id = Column(String(36))
    material_name = Column(String(200), nullable=False)
    material_code = Column(String(50))
    production_date = Column(Date)
    harvest_season = Column(String(20))
    origin_region = Column(String(100))
    specification = Column(String(200))
    starch_content = Column(Numeric(6, 2))
    moisture_content = Column(Numeric(6, 2))
    base_liquor_year = Column(Integer)
    quantity = Column(Numeric(18, 4), nullable=False)
    unit = Column(String(20))
    storage_location_id = Column(String(36))
    storage_start_date = Column(DateTime)
    expiry_date = Column(Date)
    current_status = Column(String(20), default="待检")
    quality_level = Column(String(20))
    trace_code = Column(String(100))
    remarks = Column(Text)
    create_time = Column(DateTime, default=datetime.utcnow)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    quality_inspections = relationship("QualityInspection", back_populates="batch")
    
    __table_args__ = (
        Index("idx_batch_number", "batch_number"),
        Index("idx_batch_status", "current_status"),
    )
