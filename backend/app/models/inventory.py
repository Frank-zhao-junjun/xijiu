"""
Inventory models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Numeric, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Inventory(Base):
    __tablename__ = "inventory"
    
    inventory_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(UUID(as_uuid=True), nullable=False)
    material_name = Column(String(200), nullable=False)
    material_code = Column(String(50))
    storage_location_id = Column(UUID(as_uuid=True), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True))
    quantity = Column(Numeric(18, 4), default=0)
    available_quantity = Column(Numeric(18, 4), default=0)
    frozen_quantity = Column(Numeric(18, 4), default=0)
    locked_quantity = Column(Numeric(18, 4), default=0)
    unit = Column(String(20))
    safe_stock = Column(Numeric(18, 4), default=0)
    max_stock = Column(Numeric(18, 4))
    reorder_point = Column(Numeric(18, 4))
    unit_cost = Column(Numeric(18, 4))
    total_value = Column(Numeric(18, 2))
    last_inbound_date = Column(DateTime)
    last_outbound_date = Column(DateTime)
    avg_storage_days = Column(Integer)
    status = Column(String(20), default="正常")
    create_time = Column(DateTime, default=datetime.utcnow)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index("idx_inventory_material", "material_id"),
        Index("idx_inventory_status", "status"),
    )


class InventoryAlert(Base):
    __tablename__ = "inventory_alert"
    
    alert_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventory.inventory_id"))
    alert_type = Column(String(30))
    alert_level = Column(String(20))
    threshold = Column(Numeric(18, 4))
    actual_value = Column(Numeric(18, 4))
    is_resolved = Column(String(10), default="否")
    resolve_time = Column(DateTime)
    resolve_remarks = Column(Text)
    create_time = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (Index("idx_alert_resolved", "is_resolved"),)
