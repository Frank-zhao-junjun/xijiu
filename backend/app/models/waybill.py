"""
Waybill models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, Numeric, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class Waybill(Base):
    __tablename__ = "waybill"
    
    waybill_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    waybill_number = Column(String(50), unique=True, nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_order.order_id"))
    order_number = Column(String(50))
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("supplier.supplier_id"))
    carrier_name = Column(String(200))
    vehicle_number = Column(String(50))
    driver_name = Column(String(100))
    driver_phone = Column(String(50))
    source_location = Column(JSONB)
    dest_location = Column(JSONB)
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
    
    point_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    waybill_id = Column(UUID(as_uuid=True), ForeignKey("waybill.waybill_id"), nullable=False)
    point_time = Column(DateTime, nullable=False)
    latitude = Column(Numeric(10, 6))
    longitude = Column(Numeric(10, 6))
    location_name = Column(String(200))
    speed = Column(Numeric(6, 2))
    heading = Column(Integer)
    event_type = Column(String(30))
    remarks = Column(String(500))
    create_time = Column(DateTime, default=datetime.utcnow)
    
    waybill = relationship("Waybill", back_populates="tracking_points")
    
    __table_args__ = (Index("idx_track_waybill", "waybill_id"),)


class SignRecord(Base):
    __tablename__ = "sign_record"
    
    sign_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    waybill_id = Column(UUID(as_uuid=True), ForeignKey("waybill.waybill_id"), nullable=False)
    sign_time = Column(DateTime, nullable=False)
    signed_by = Column(String(100))
    sign_type = Column(String(20))
    sign_quantity = Column(Numeric(18, 4))
    difference_quantity = Column(Numeric(18, 4))
    sign_photo_url = Column(String(500))
    remarks = Column(Text)
    create_time = Column(DateTime, default=datetime.utcnow)
    
    waybill = relationship("Waybill", back_populates="sign_record")
    
    __table_args__ = (Index("idx_sign_waybill", "waybill_id"),)
