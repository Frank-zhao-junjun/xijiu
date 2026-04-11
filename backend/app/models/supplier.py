"""
Supplier models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, Date, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Supplier(Base):
    __tablename__ = "supplier"
    
    supplier_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    type = Column(String(20), nullable=False)
    category = Column(String(100))
    business_license = Column(String(50))
    contact_person = Column(String(100))
    contact_phone = Column(String(50))
    contact_email = Column(String(100))
    bank_name = Column(String(200))
    bank_account = Column(String(100))
    address = Column(Text, default='{}')
    status = Column(String(20), default="待审核")
    credit_level = Column(String(10), default="C")
    create_time = Column(DateTime, default=datetime.utcnow)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    rating_history = relationship("SupplierRatingHistory", back_populates="supplier", cascade="all, delete-orphan")
    qualifications = relationship("SupplierQualification", back_populates="supplier", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
    
    __table_args__ = (
        Index("idx_supplier_status", "status"),
        Index("idx_supplier_type", "type"),
    )


class SupplierRatingHistory(Base):
    __tablename__ = "supplier_rating_history"
    
    rating_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_id = Column(String(36), ForeignKey("supplier.supplier_id"), nullable=False)
    rating_year = Column(Integer, nullable=False)
    rating_level = Column(String(10), nullable=False)
    rating_date = Column(DateTime, nullable=False)
    rating_by = Column(String(100))
    remarks = Column(Text)
    create_time = Column(DateTime, default=datetime.utcnow)
    
    supplier = relationship("Supplier", back_populates="rating_history")
    
    __table_args__ = (Index("idx_rating_supplier", "supplier_id"),)


class SupplierQualification(Base):
    __tablename__ = "supplier_qualification"
    
    qual_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_id = Column(String(36), ForeignKey("supplier.supplier_id"), nullable=False)
    qual_type = Column(String(50), nullable=False)
    qual_name = Column(String(200))
    qual_number = Column(String(100))
    issue_date = Column(Date)
    expiry_date = Column(Date)
    issue_org = Column(String(200))
    status = Column(String(20), default="有效")
    create_time = Column(DateTime, default=datetime.utcnow)
    
    supplier = relationship("Supplier", back_populates="qualifications")
    
    __table_args__ = (Index("idx_qual_supplier", "supplier_id"),)
