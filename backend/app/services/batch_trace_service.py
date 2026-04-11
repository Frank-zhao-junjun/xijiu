"""
批次追溯服务 - Batch Trace Service
提供批次全生命周期追溯能力
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.batch import Batch
from app.models.purchase_order import PurchaseOrder, OrderLineItem
from app.models.quality_inspection import QualityInspection, InspectionItem
from app.models.waybill import Waybill, SignRecord
from app.models.inventory import Inventory


class BatchTraceService:
    """批次追溯服务"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def trace_batch(self, batch_number: str) -> Optional[Dict[str, Any]]:
        """
        追溯批次全流程信息
        
        追溯链路：
        采购订单 → 供应商发货 → 运单 → 到货签收 → 批次创建 → 质检 → 入库
        """
        # Get batch
        batch_result = await self.db.execute(
            select(Batch).filter(Batch.batch_number == batch_number)
        )
        batch = batch_result.scalar_one_or_none()
        
        if not batch:
            return None
        
        # Build trace info
        trace_info = {
            "batch": self._format_batch(batch),
            "source_order": None,
            "supplier": None,
            "waybill": None,
            "sign_record": None,
            "inspections": [],
            "inventory": None,
            "quality_summary": None
        }
        
        # Get source order
        if batch.source_order_id:
            order_result = await self.db.execute(
                select(PurchaseOrder).filter(PurchaseOrder.order_id == batch.source_order_id)
            )
            order = order_result.scalar_one_or_none()
            if order:
                trace_info["source_order"] = {
                    "order_id": str(order.order_id),
                    "order_number": order.order_number,
                    "status": order.status,
                    "total_amount": float(order.total_amount),
                    "expected_delivery_date": str(order.expected_delivery_date) if order.expected_delivery_date else None
                }
                
                # Get supplier
                supplier_result = await self.db.execute(
                    select(PurchaseOrder.supplier).filter(PurchaseOrder.order_id == order.order_id)
                )
                supplier = supplier_result.scalar_one_or_none()
                if supplier:
                    trace_info["supplier"] = {
                        "supplier_id": str(supplier.supplier_id),
                        "name": supplier.name,
                        "type": supplier.type,
                        "contact_person": supplier.contact_person,
                        "contact_phone": supplier.contact_phone
                    }
        
        # Get waybill
        waybill_result = await self.db.execute(
            select(Waybill)
            .options(selectinload(Waybill.sign_record))
            .filter(Waybill.order_id == batch.source_order_id)
        )
        waybill = waybill_result.scalar_one_or_none()
        if waybill:
            trace_info["waybill"] = {
                "waybill_id": str(waybill.waybill_id),
                "waybill_number": waybill.waybill_number,
                "carrier_name": waybill.carrier_name,
                "vehicle_number": waybill.vehicle_number,
                "driver_name": waybill.driver_name,
                "departure_time": str(waybill.departure_time) if waybill.departure_time else None,
                "actual_arrival_time": str(waybill.actual_arrival_time) if waybill.actual_arrival_time else None,
                "sign_record": {
                    "sign_time": str(waybill.sign_record.sign_time) if waybill.sign_record else None,
                    "signed_by": waybill.sign_record.signed_by if waybill.sign_record else None,
                    "sign_quantity": float(waybill.sign_record.sign_quantity) if waybill.sign_record else None,
                    "difference_quantity": float(waybill.sign_record.difference_quantity) if waybill.sign_record else None
                } if waybill.sign_record else None
            }
        
        # Get inspections
        inspection_result = await self.db.execute(
            select(QualityInspection)
            .options(selectinload(QualityInspection.inspection_items))
            .filter(QualityInspection.batch_id == batch.batch_id)
        )
        inspections = inspection_result.scalars().unique().all()
        
        for insp in inspections:
            trace_info["inspections"].append({
                "inspection_id": str(insp.inspection_id),
                "inspection_number": insp.inspection_number,
                "inspection_type": insp.inspection_type,
                "inspector": insp.inspector,
                "status": insp.status,
                "judgment_result": insp.judgment_result,
                "judgment_time": str(insp.judgment_time) if insp.judgment_time else None,
                "items": [
                    {
                        "item_name": item.item_name,
                        "standard_value": item.standard_value,
                        "actual_value": item.actual_value,
                        "is_passed": item.is_passed
                    }
                    for item in insp.inspection_items
                ]
            })
        
        # Quality summary
        passed_count = sum(1 for i in trace_info["inspections"] if i["judgment_result"] == "合格")
        total_inspections = len(trace_info["inspections"])
        trace_info["quality_summary"] = {
            "total_inspections": total_inspections,
            "passed_count": passed_count,
            "pass_rate": round(passed_count / total_inspections * 100, 2) if total_inspections > 0 else 0
        }
        
        # Get inventory
        inventory_result = await self.db.execute(
            select(Inventory).filter(Inventory.material_id == batch.material_id)
        )
        inventory = inventory_result.scalar_one_or_none()
        if inventory:
            trace_info["inventory"] = {
                "quantity": float(inventory.quantity),
                "available_quantity": float(inventory.available_quantity),
                "unit": inventory.unit,
                "status": inventory.status
            }
        
        return trace_info
    
    def _format_batch(self, batch: Batch) -> Dict[str, Any]:
        """格式化批次信息"""
        return {
            "batch_id": str(batch.batch_id),
            "batch_number": batch.batch_number,
            "material_name": batch.material_name,
            "material_code": batch.material_code,
            "specification": batch.specification,
            "quantity": float(batch.quantity),
            "unit": batch.unit,
            "production_date": str(batch.production_date) if batch.production_date else None,
            "origin_region": batch.origin_region,
            "harvest_season": batch.harvest_season,
            "starch_content": float(batch.starch_content) if batch.starch_content else None,
            "moisture_content": float(batch.moisture_content) if batch.moisture_content else None,
            "current_status": batch.current_status,
            "quality_level": batch.quality_level,
            "trace_code": batch.trace_code,
            "storage_start_date": str(batch.storage_start_date) if batch.storage_start_date else None,
            "expiry_date": str(batch.expiry_date) if batch.expiry_date else None,
            "create_time": str(batch.create_time)
        }
    
    async def generate_trace_code(self, batch_id: UUID) -> str:
        """生成批次追溯码"""
        # Simple trace code format: BC + timestamp + random suffix
        import random
        import string
        timestamp = datetime.now().strftime("%Y%m%d%H%M")
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        trace_code = f"BC{timestamp}{suffix}"
        
        # Update batch
        result = await self.db.execute(
            select(Batch).filter(Batch.batch_id == batch_id)
        )
        batch = result.scalar_one_or_none()
        if batch:
            batch.trace_code = trace_code
            await self.db.commit()
        
        return trace_code
