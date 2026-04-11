"""API schemas"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    status: str = "active"
    rating: float = 5.0

class SupplierCreate(SupplierBase): pass
class SupplierUpdate(BaseModel):
    name: Optional[str] = None; contact_person: Optional[str] = None
    phone: Optional[str] = None; email: Optional[str] = None
    address: Optional[str] = None; status: Optional[str] = None; rating: Optional[float] = None

class SupplierResponse(SupplierBase):
    id: int; created_at: datetime; updated_at: datetime
    class Config: from_attributes = True

class MaterialBase(BaseModel):
    name: str; category: Optional[str] = None; unit: str = "吨"
    unit_price: float = 0.0; stock_quantity: float = 0.0
    reorder_point: float = 10.0; supplier_id: Optional[int] = None; origin: Optional[str] = None

class MaterialCreate(MaterialBase): pass
class MaterialUpdate(BaseModel):
    name: Optional[str] = None; category: Optional[str] = None; unit: Optional[str] = None
    unit_price: Optional[float] = None; stock_quantity: Optional[float] = None
    reorder_point: Optional[float] = None; supplier_id: Optional[int] = None; origin: Optional[str] = None

class MaterialResponse(MaterialBase):
    id: int; created_at: datetime; updated_at: datetime
    class Config: from_attributes = True

class ProductBase(BaseModel):
    name: str; brand: Optional[str] = None; category: Optional[str] = None
    abv: float = 53.0; specification: Optional[str] = None
    unit_price: float = 0.0; stock_quantity: int = 0
    status: str = "active"; description: Optional[str] = None

class ProductCreate(ProductBase): pass
class ProductUpdate(BaseModel):
    name: Optional[str] = None; brand: Optional[str] = None; category: Optional[str] = None
    abv: Optional[float] = None; specification: Optional[str] = None
    unit_price: Optional[float] = None; stock_quantity: Optional[int] = None
    status: Optional[str] = None; description: Optional[str] = None

class ProductResponse(ProductBase):
    id: int; created_at: datetime; updated_at: datetime
    class Config: from_attributes = True

class PurchaseOrderItemBase(BaseModel):
    material_id: int; quantity: float; unit_price: float; subtotal: float

class PurchaseOrderItemCreate(PurchaseOrderItemBase): pass

class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    id: int
    class Config: from_attributes = True

class PurchaseOrderBase(BaseModel):
    supplier_id: int; expected_delivery_date: Optional[datetime] = None; notes: Optional[str] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None; expected_delivery_date: Optional[datetime] = None
    actual_delivery_date: Optional[datetime] = None; notes: Optional[str] = None

class PurchaseOrderResponse(PurchaseOrderBase):
    id: int; order_no: str; total_amount: float; status: str
    actual_delivery_date: Optional[datetime] = None; created_at: datetime; updated_at: datetime
    items: List[PurchaseOrderItemResponse] = []
    class Config: from_attributes = True

class SalesOrderBase(BaseModel):
    product_id: int; customer_name: str; customer_contact: Optional[str] = None
    quantity: int; unit_price: float; total_amount: float
    shipping_address: Optional[str] = None; expected_ship_date: Optional[datetime] = None; notes: Optional[str] = None

class SalesOrderCreate(SalesOrderBase): pass
class SalesOrderUpdate(BaseModel):
    status: Optional[str] = None; expected_ship_date: Optional[datetime] = None
    actual_ship_date: Optional[datetime] = None; notes: Optional[str] = None

class SalesOrderResponse(SalesOrderBase):
    id: int; order_no: str; status: str; actual_ship_date: Optional[datetime] = None
    created_at: datetime; updated_at: datetime
    class Config: from_attributes = True

class MaterialUsageBase(BaseModel):
    material_name: str; quantity: float

class MaterialUsageCreate(MaterialUsageBase): pass

class MaterialUsageResponse(MaterialUsageBase):
    id: int
    class Config: from_attributes = True

class ProductionRecordBase(BaseModel):
    product_id: int; batch_no: str; quantity: int; qualified_quantity: int = 0
    quality_rate: float = 0.0; operator: Optional[str] = None; notes: Optional[str] = None

class ProductionRecordCreate(ProductionRecordBase):
    material_usages: List[MaterialUsageCreate] = []

class ProductionRecordResponse(ProductionRecordBase):
    id: int; production_date: datetime; created_at: datetime
    material_usages: List[MaterialUsageResponse] = []
    class Config: from_attributes = True

class WarehouseBase(BaseModel):
    name: str; location: Optional[str] = None; capacity: int = 0
    current_stock: int = 0; manager: Optional[str] = None; status: str = "active"

class WarehouseCreate(WarehouseBase): pass
class WarehouseUpdate(BaseModel):
    name: Optional[str] = None; location: Optional[str] = None; capacity: Optional[int] = None
    current_stock: Optional[int] = None; manager: Optional[str] = None; status: Optional[str] = None

class WarehouseResponse(WarehouseBase):
    id: int; created_at: datetime
    class Config: from_attributes = True

class DashboardStats(BaseModel):
    total_products: int; total_suppliers: int; total_orders: int; total_revenue: float
    pending_orders: int; low_stock_materials: int; production_today: int
