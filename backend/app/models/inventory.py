"""
Inventory models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Numeric, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Inventory(Base):
    __tablename__ = "inventory"
    
    inventory_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    material_id = Column(String(36), nullable=False)
    material_name = Column(String(200), nullable=False)
    material_code = Column(String(50))
    storage_location_id = Column(String(36), nullable=False)
    warehouse_id = Column(String(36))
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
    
    alert_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inventory_id = Column(String(36), ForeignKey("inventory.inventory_id"))
    alert_type = Column(String(30))
    alert_level = Column(String(20))
    threshold = Column(Numeric(18, 4))
    current_value = Column(Numeric(18, 4))
    message = Column(Text)
    status = Column(String(20), default="未处理")
    create_time = Column(DateTime, default=datetime.utcnow)
    handle_time = Column(DateTime)
    handle_by = Column(String(100))
    handle_remarks = Column(Text)
