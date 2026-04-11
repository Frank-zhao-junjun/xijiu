"""
Waybill models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Waybill(Base):
    __tablename__ = "waybill"
    
    waybill_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    waybill_number = Column(String(50), unique=True, nullable=False)
    order_id = Column(String(36), ForeignKey("purchase_order.order_id"))
    order_number = Column(String(50))
    supplier_id = Column(String(36), ForeignKey("supplier.supplier_id"))
    carrier_name = Column(String(200))
    vehicle_number = Column(String(50))
    driver_name = Column(String(100))
    driver_phone = Column(String(50))
    source_location = Column(Text)
    dest_location = Column(Text)
    cargo_type = Column(String(100))
    total_quantity = Column(Numeric(18, 4))
    total_weight = Column(Numeric(18, 4))
    package_count = Column(Integer)
    temperature_control = Column(String(20))
    departure_time = Column(DateTime)
    estimated_arrival_time = Column(DateTime)
    actual_arrival_time = Column(DateTime)
    status = Column(String(20), default="待发货")
    cargo_value = Column(Numeric(18, 2))
    freight_cost = Column(Numeric(18, 2))
    create_time = Column(DateTime, default=datetime.utcnow)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    order = relationship("PurchaseOrder", back_populates="waybills")
    tracking_points = relationship("TrackingPoint", back_populates="waybill", cascade="all, delete-orphan")
    sign_record = relationship("SignRecord", back_populates="waybill", uselist=False, cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("idx_waybill_number", "waybill_number"),
        Index("idx_waybill_status", "status"),
    )


class TrackingPoint(Base):
    __tablename__ = "tracking_point"
    
    point_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    waybill_id = Column(String(36), ForeignKey("waybill.waybill_id"), nullable=False)
    location = Column(String(200))
    description = Column(Text)
    longitude = Column(Numeric(10, 6))
    latitude = Column(Numeric(10, 6))
    status = Column(String(20))
    record_time = Column(DateTime, default=datetime.utcnow)
    
    waybill = relationship("Waybill", back_populates="tracking_points")
    
    __table_args__ = (Index("idx_tracking_waybill", "waybill_id"),)


class SignRecord(Base):
    __tablename__ = "sign_record"
    
    record_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    waybill_id = Column(String(36), ForeignKey("waybill.waybill_id"), nullable=False)
    signer_name = Column(String(100))
    signer_phone = Column(String(50))
    sign_time = Column(DateTime)
    sign_photo_url = Column(String(500))
    total_packages = Column(Integer)
    received_packages = Column(Integer)
    damaged_packages = Column(Integer, default=0)
    shortage_packages = Column(Integer, default=0)
    remarks = Column(Text)
    
    waybill = relationship("Waybill", back_populates="sign_record")
