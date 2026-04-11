"""白酒供应链数据模型"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PRODUCTION = "in_production"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class ProductStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    OUT_OF_STOCK = "out_of_stock"

class SupplierStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLACKLISTED = "blacklisted"

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    contact_person = Column(String(100))
    phone = Column(String(50))
    email = Column(String(100))
    address = Column(String(500))
    status = Column(SQLEnum(SupplierStatus), default=SupplierStatus.ACTIVE)
    rating = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    materials = relationship("Material", back_populates="supplier")
    orders = relationship("PurchaseOrder", back_populates="supplier")

class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    category = Column(String(100))
    unit = Column(String(50), default="吨")
    unit_price = Column(Float, default=0.0)
    stock_quantity = Column(Float, default=0.0)
    reorder_point = Column(Float, default=10.0)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    origin = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    supplier = relationship("Supplier", back_populates="materials")
    order_items = relationship("PurchaseOrderItem", back_populates="material")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    brand = Column(String(100))
    category = Column(String(100))
    abv = Column(Float, default=53.0)
    specification = Column(String(100))
    unit_price = Column(Float, default=0.0)
    stock_quantity = Column(Integer, default=0)
    status = Column(SQLEnum(ProductStatus), default=ProductStatus.ACTIVE)
    description = Column(String(1000))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    production_records = relationship("ProductionRecord", back_populates="product")
    sales_orders = relationship("SalesOrder", back_populates="product")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    total_amount = Column(Float, default=0.0)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    expected_delivery_date = Column(DateTime)
    actual_delivery_date = Column(DateTime)
    notes = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    supplier = relationship("Supplier", back_populates="orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    material = relationship("Material", back_populates="order_items")

class ProductionRecord(Base):
    __tablename__ = "production_records"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    batch_no = Column(String(50), unique=True, nullable=False)
    production_date = Column(DateTime, default=datetime.utcnow)
    quantity = Column(Integer, nullable=False)
    qualified_quantity = Column(Integer, default=0)
    quality_rate = Column(Float, default=0.0)
    operator = Column(String(100))
    notes = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    product = relationship("Product", back_populates="production_records")
    material_usages = relationship("MaterialUsage", back_populates="production_record", cascade="all, delete-orphan")

class MaterialUsage(Base):
    __tablename__ = "material_usages"
    id = Column(Integer, primary_key=True, index=True)
    production_record_id = Column(Integer, ForeignKey("production_records.id"), nullable=False)
    material_name = Column(String(200), nullable=False)
    quantity = Column(Float, nullable=False)
    production_record = relationship("ProductionRecord", back_populates="material_usages")

class SalesOrder(Base):
    __tablename__ = "sales_orders"
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    customer_name = Column(String(200), nullable=False)
    customer_contact = Column(String(100))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    shipping_address = Column(String(500))
    expected_ship_date = Column(DateTime)
    actual_ship_date = Column(DateTime)
    notes = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    product = relationship("Product", back_populates="sales_orders")

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    location = Column(String(500))
    capacity = Column(Integer, default=0)
    current_stock = Column(Integer, default=0)
    manager = Column(String(100))
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
