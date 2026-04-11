"""
质检判定服务 - Quality Judgment Service
提供质检流程管理和判定逻辑
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.quality_inspection import QualityInspection, InspectionItem
from app.models.batch import Batch


class QualityService:
    """质检判定服务"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_inspection(
        self,
        batch_id: UUID,
        inspection_type: str,
        inspector: str,
        sampling_size: int,
        material_name: str,
        material_code: Optional[str] = None
    ) -> QualityInspection:
        """创建质检单"""
        # Get batch info
        batch_result = await self.db.execute(
            select(Batch).filter(Batch.batch_id == batch_id)
        )
        batch = batch_result.scalar_one_or_none()
        
        if not batch:
            raise ValueError(f"批次不存在: {batch_id}")
        
        # Generate inspection number
        count_result = await self.db.execute(
            select(QualityInspection).filter(True)
        )
        count = len(count_result.scalars().all())
        inspection_number = f"QI-{datetime.now().strftime('%Y%m%d')}-{str(count + 1).zfill(4)}"
        
        # Create inspection
        inspection = QualityInspection(
            inspection_number=inspection_number,
            batch_id=batch_id,
            batch_number=batch.batch_number,
            material_name=material_name,
            material_code=material_code or batch.material_code,
            inspection_type=inspection_type,
            sample_size=sampling_size,
            inspector=inspector,
            sampling_time=datetime.utcnow(),
            status="待检"
        )
        
        self.db.add(inspection)
        await self.db.commit()
        await self.db.refresh(inspection)
        
        return inspection
    
    async def submit_inspection_result(
        self,
        inspection_id: UUID,
        items: List[Dict[str, Any]],
        judgment_result: str,
        judgment_by: str,
        conclusion: Optional[str] = None,
        reject_reason: Optional[str] = None
    ) -> QualityInspection:
        """
        提交质检结果
        
        Args:
            inspection_id: 质检单ID
            items: 质检项目结果列表
            judgment_result: 判定结果（合格/不合格/让步接收）
            judgment_by: 判定人
            conclusion: 检验结论
            reject_reason: 不合格原因
        """
        # Get inspection
        result = await self.db.execute(
            select(QualityInspection)
            .options(selectinload(QualityInspection.inspection_items))
            .filter(QualityInspection.inspection_id == inspection_id)
        )
        inspection = result.scalar_one_or_none()
        
        if not inspection:
            raise ValueError(f"质检单不存在: {inspection_id}")
        
        if inspection.status == "已判定":
            raise ValueError("该质检单已完成判定")
        
        # Update inspection items
        for item_data in items:
            item = InspectionItem(
                inspection_id=inspection_id,
                item_name=item_data["item_name"],
                item_category=item_data.get("item_category"),
                standard_value=item_data.get("standard_value"),
                actual_value=item_data.get("actual_value"),
                is_passed=item_data.get("is_passed", True),
                unit=item_data.get("unit"),
                test_time=datetime.utcnow()
            )
            self.db.add(item)
        
        # Update inspection status
        inspection.status = "已判定"
        inspection.judgment_result = judgment_result
        inspection.judgment_by = judgment_by
        inspection.judgment_time = datetime.utcnow()
        
        if conclusion:
            inspection.conclusion = conclusion
        if reject_reason:
            inspection.reject_reason = reject_reason
        
        # Update batch status based on judgment
        await self._update_batch_status(inspection.batch_id, judgment_result)
        
        await self.db.commit()
        await self.db.refresh(inspection)
        
        return inspection
    
    async def _update_batch_status(
        self, 
        batch_id: UUID, 
        judgment_result: str
    ):
        """根据质检结果更新批次状态"""
        batch_result = await self.db.execute(
            select(Batch).filter(Batch.batch_id == batch_id)
        )
        batch = batch_result.scalar_one_or_none()
        
        if not batch:
            return
        
        if judgment_result == "合格":
            batch.current_status = "合格"
            batch.quality_level = "一等"
        elif judgment_result == "不合格":
            batch.current_status = "不合格"
            batch.quality_level = "不合格"
        elif judgment_result == "让步接收":
            batch.current_status = "合格"
            batch.quality_level = "合格"
        
        await self.db.commit()
    
    async def get_inspection_detail(
        self, 
        inspection_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """获取质检详情"""
        result = await self.db.execute(
            select(QualityInspection)
            .options(selectinload(QualityInspection.inspection_items))
            .filter(QualityInspection.inspection_id == inspection_id)
        )
        inspection = result.scalar_one_or_none()
        
        if not inspection:
            return None
        
        return {
            "inspection_id": str(inspection.inspection_id),
            "inspection_number": inspection.inspection_number,
            "batch_id": str(inspection.batch_id),
            "batch_number": inspection.batch_number,
            "material_name": inspection.material_name,
            "inspection_type": inspection.inspection_type,
            "sample_size": inspection.sample_size,
            "inspector": inspection.inspector,
            "status": inspection.status,
            "judgment_result": inspection.judgment_result,
            "judgment_by": inspection.judgment_by,
            "judgment_time": str(inspection.judgment_time) if inspection.judgment_time else None,
            "reject_reason": inspection.reject_reason,
            "conclusion": inspection.conclusion,
            "items": [
                {
                    "item_id": str(item.item_id),
                    "item_name": item.item_name,
                    "standard_value": item.standard_value,
                    "actual_value": item.actual_value,
                    "is_passed": item.is_passed,
                    "unit": item.unit
                }
                for item in inspection.inspection_items
            ]
        }
