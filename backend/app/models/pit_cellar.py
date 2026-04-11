"""
Pit Cellar models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Date, Numeric, Integer, Index
from sqlalchemy.orm import relationship
from app.database import Base


class PitCellar(Base):
    __tablename__ = "pit_cellar"
    
    pit_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pit_code = Column(String(50), unique=True, nullable=False)
    pit_name = Column(String(100))
    cellar_name = Column(String(100))
    pit_type = Column(String(30))
    capacity = Column(Numeric(10, 2))
    current_fill_rate = Column(Numeric(5, 2))
    status = Column(String(20), default="空闲")
    activation_date = Column(Date)
    expected_open_date = Column(Date)
    actual_open_date = Column(Date)
    fermentation_cycle = Column(Integer)
    current_cycle_days = Column(Integer)
    base_liquor_yield = Column(Numeric(6, 2))
    base_liquor_grade = Column(Numeric(5, 2))
    temperature_range = Column(String(50))
    humidity_range = Column(String(50))
    remarks = Column(Text)
    create_time = Column(DateTime, default=datetime.utcnow)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index("idx_pit_code", "pit_code"),
        Index("idx_pit_status", "status"),
    )
