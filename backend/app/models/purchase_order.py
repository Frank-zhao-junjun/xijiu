"""
Purchase Order models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Date, Integer, Numeric, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class PurchaseOrder(Base):
    __tablename__ = "purchase_order"
    
    order_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(50), unique=True, nullable=False)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("supplier.supplier_id"), nullable=False)
    plan_type = Column(String(20))
    season_tag = Column(String(20))
    total_amount = Column(Numeric(18, 2), default=0)
    currency = Column(String(10), default="CNY")
    payment_term = Column(JSONB)
    delivery_term = Column(JSONB)
    expected_delivery_date = Column(Date)
    actual_delivery_date = Column(Date)
    status = Column(String(20), default="草稿")
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_by = Column(String(100))
    approved_at = Column(DateTime)
    remarks = Column(Text)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    supplier = relationship("Supplier", back_populates="purchase_orders")
    line_items = relationship("OrderLineItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    waybills = relationship("Waybill", back_populates="order")
    
    __table_args__ = (
        Index("idx_order_number", "order_number"),
        Index("idx_order_supplier", "supplier_id"),
        Index("idx_order_status", "status"),
    )


class OrderLineItem(Base):
    __tablename__ = "order_line_item"
    
    line_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_order.order_id"), nullable=False)
    material_id = Column(UUID(as_uuid=True))
    material_name = Column(String(200), nullable=False)
    material_code = Column(String(50))
    specification = Column(String(200))
    quantity = Column(Numeric(18, 4), nullable=False)
    unit = Column(String(20))
    unit_price = Column(Numeric(18, 4))
    subtotal = Column(Numeric(18, 2))
    delivery_date = Column(Date)
    actual_delivered_qty = Column(Numeric(18, 4), default=0)
    arrived_qty = Column(Numeric(18, 4), default=0)
    accepted_qty = Column(Numeric(18, 4), default=0)
    line_number = Column(Integer, nullable=False)
    create_time = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("PurchaseOrder", back_populates="line_items")
    
    __table_args__ = (Index("idx_line_order", "order_id"),)


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    
    history_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_order.order_id"), nullable=False)
    from_status = Column(String(20))
    to_status = Column(String(20), nullable=False)
    change_time = Column(DateTime, default=datetime.utcnow)
    changed_by = Column(String(100))
    reason = Column(String(500))
    
    order = relationship("PurchaseOrder", back_populates="status_history")
    
    __table_args__ = (Index("idx_history_order", "order_id"),)
