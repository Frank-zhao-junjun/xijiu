"""
Dashboard Pydantic schemas
"""
from datetime import date
from decimal import Decimal
from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_orders: int
    pending_orders: int
    delivered_orders: int
    total_amount: Decimal
    inventory_quantity: Decimal
    inventory_value: Decimal
    supplier_count: int
    inspection_pending: int
    inspection_passed: int


class OrderTrend(BaseModel):
    date: date
    order_count: int
    order_amount: Decimal


class FulfillmentStatus(BaseModel):
    status: str
    count: int
    percentage: float


class AlertItem(BaseModel):
    id: int
    type: str
    title: str
    description: str
    time: str
    level: str


class TodoItem(BaseModel):
    id: int
    title: str
    category: str
    priority: str
    time: str
