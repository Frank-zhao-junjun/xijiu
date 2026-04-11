"""
Production Order models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Date, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class ProductionOrder(Base):
    __tablename__ = "production_order"
    
    order_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(50), unique=True, nullable=False)
    pit_id = Column(UUID(as_uuid=True))
    pit_code = Column(String(50))
    product_name = Column(String(200))
    product_code = Column(String(50))
    planned_quantity = Column(Numeric(18, 4))
    actual_quantity = Column(Numeric(18, 4))
    unit = Column(String(20))
    planned_start_date = Column(Date)
    planned_end_date = Column(Date)
    actual_start_date = Column(Date)
    actual_end_date = Column(Date)
    status = Column(String(20), default="计划中")
    material_requirements = Column(Text)
    base_liquor_grade = Column(Numeric(5, 2))
    quality_score = Column(Numeric(5, 2))
    remarks = Column(Text)
    create_time = Column(DateTime, default=datetime.utcnow)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index("idx_prod_order_number", "order_number"),
        Index("idx_prod_order_status", "status"),
    )
