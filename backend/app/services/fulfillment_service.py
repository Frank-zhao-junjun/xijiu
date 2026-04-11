"""
履约追踪服务 - Fulfillment Tracking Service
追踪采购订单从创建到入库的全流程履约状态
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.purchase_order import PurchaseOrder, OrderLineItem
from app.models.waybill import Waybill, SignRecord
from app.models.batch import Batch


class FulfillmentService:
    """履约追踪服务"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_order_fulfillment(self, order_id: UUID) -> Dict[str, Any]:
        """
        获取订单履约详情
        
        Returns:
            履约状态详情，包含：
            - order: 订单基本信息
            - line_items: 订单明细及履约进度
            - waybills: 关联运单列表
            - batches: 关联批次列表
            - fulfillment_rate: 履约完成率
        """
        # Get order with line items
        order_result = await self.db.execute(
            select(PurchaseOrder)
            .options(selectinload(PurchaseOrder.line_items))
            .filter(PurchaseOrder.order_id == order_id)
        )
        order = order_result.scalar_one_or_none()
        
        if not order:
            return None
        
        # Get waybills
        waybills_result = await self.db.execute(
            select(Waybill)
            .options(selectinload(Waybill.sign_record))
            .filter(Waybill.order_id == order_id)
        )
        waybills = waybills_result.scalars().all()
        
        # Get batches
        batches_result = await self.db.execute(
            select(Batch).filter(Batch.source_order_id == order_id)
        )
        batches = batches_result.scalars().all()
        
        # Calculate fulfillment rate
        fulfillment_rate = self._calculate_fulfillment_rate(order.line_items)
        
        return {
            "order": {
                "order_id": str(order.order_id),
                "order_number": order.order_number,
                "status": order.status,
                "total_amount": float(order.total_amount),
                "expected_delivery_date": str(order.expected_delivery_date) if order.expected_delivery_date else None,
                "actual_delivery_date": str(order.actual_delivery_date) if order.actual_delivery_date else None
            },
            "line_items": [
                {
                    "line_id": str(item.line_id),
                    "material_name": item.material_name,
                    "quantity": float(item.quantity),
                    "delivered_qty": float(item.actual_delivered_qty),
                    "arrived_qty": float(item.arrived_qty),
                    "accepted_qty": float(item.accepted_qty),
                    "fulfillment_rate": self._calc_item_rate(item)
                }
                for item in order.line_items
            ],
            "waybills": [
                {
                    "waybill_id": str(w.waybill_id),
                    "waybill_number": w.waybill_number,
                    "status": w.status,
                    "departure_time": str(w.departure_time) if w.departure_time else None,
                    "actual_arrival_time": str(w.actual_arrival_time) if w.actual_arrival_time else None,
                    "sign_quantity": float(w.sign_record.sign_quantity) if w.sign_record else None
                }
                for w in waybills
            ],
            "batches": [
                {
                    "batch_id": str(b.batch_id),
                    "batch_number": b.batch_number,
                    "material_name": b.material_name,
                    "quantity": float(b.quantity),
                    "status": b.current_status
                }
                for b in batches
            ],
            "fulfillment_rate": fulfillment_rate
        }
    
    def _calculate_fulfillment_rate(self, line_items: List[OrderLineItem]) -> float:
        """计算订单整体履约率"""
        if not line_items:
            return 0.0
        
        total_accepted = sum(float(item.accepted_qty) for item in line_items)
        total_quantity = sum(float(item.quantity) for item in line_items)
        
        if total_quantity == 0:
            return 0.0
        
        return round(total_accepted / total_quantity * 100, 2)
    
    def _calc_item_rate(self, item: OrderLineItem) -> float:
        """计算明细项履约率"""
        quantity = float(item.quantity)
        if quantity == 0:
            return 0.0
        return round(float(item.accepted_qty) / quantity * 100, 2)
    
    async def get_supplier_fulfillment_summary(
        self, 
        supplier_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """获取供应商履约汇总"""
        query = select(PurchaseOrder).filter(
            PurchaseOrder.supplier_id == supplier_id
        )
        
        if start_date:
            query = query.filter(PurchaseOrder.created_at >= start_date)
        if end_date:
            query = query.filter(PurchaseOrder.created_at <= end_date)
        
        result = await self.db.execute(query)
        orders = result.scalars().all()
        
        total_orders = len(orders)
        on_time_count = 0
        delayed_count = 0
        total_amount = 0
        
        for order in orders:
            total_amount += float(order.total_amount)
            if order.expected_delivery_date:
                if order.actual_delivery_date:
                    if order.actual_delivery_date <= order.expected_delivery_date:
                        on_time_count += 1
                    else:
                        delayed_count += 1
        
        return {
            "supplier_id": str(supplier_id),
            "total_orders": total_orders,
            "on_time_count": on_time_count,
            "delayed_count": delayed_count,
            "on_time_rate": round(on_time_count / total_orders * 100, 2) if total_orders > 0 else 0,
            "total_amount": total_amount
        }
