"""供应商协同 API - Phase 3: 预测/要货/ASN"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List
import json

from app.core.database import get_db
from app.models.supply_chain import (
    PurchaseForecast, ForecastResponse, ForecastStatus,
    DeliverySchedule, ASN, ASNStatus,
    Supplier, PurchaseOrder, OrderStatus
)

router = APIRouter(prefix="/supplier-portal", tags=["供应商协同-预测/要货/ASN"])


# ==================== Schemas ====================

class CapacityResponseItem(BaseModel):
    material_id: int
    material_name: Optional[str] = None
    committed_qty: float
    committed_date: Optional[str] = None
    risk_level: Optional[str] = None  # low/medium/high

class CapacityResponseCreate(BaseModel):
    forecast_id: int
    supplier_id: int
    items: List[CapacityResponseItem]
    risk_summary: Optional[str] = None


class DeliveryScheduleConfirm(BaseModel):
    confirmed: bool
    adjustment_notes: Optional[str] = None
    adjusted_quantities: Optional[dict] = None  # {item_index: new_qty}


class ASNCreate(BaseModel):
    supplier_id: int
    delivery_schedule_id: Optional[int] = None
    po_id: int
    asn_no: Optional[str] = None
    carrier_name: Optional[str] = None
    carrier_contact: Optional[str] = None
    tracking_no: Optional[str] = None
    items: List[dict]  # [{material_id, material_name, quantity, batch_no, production_date}]


# ==================== US-301/302: 采购预测 & 产能响应 ====================

@router.get("/forecasts")
async def list_forecasts(
    supplier_id: int = Query(1),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """供应商查看收到的采购预测列表"""
    query = (
        select(PurchaseForecast)
        .options(selectinload(PurchaseForecast.supplier))
        .where(PurchaseForecast.supplier_id == supplier_id)
        .order_by(PurchaseForecast.created_at.desc())
    )
    if status:
        query = query.where(PurchaseForecast.status == status)
    result = await db.execute(query)
    forecasts = result.scalars().all()

    response = []
    for f in forecasts:
        # Check if supplier has already responded
        resp_result = await db.execute(
            select(ForecastResponse)
            .where(ForecastResponse.forecast_id == f.id)
            .where(ForecastResponse.supplier_id == supplier_id)
        )
        existing_resp = resp_result.scalar_one_or_none()

        items = []
        if f.items_data:
            try:
                items = json.loads(f.items_data)
            except:
                items = []

        response.append({
            "id": f.id,
            "forecast_period": f.forecast_period,
            "period_start": f.period_start.isoformat() if f.period_start else None,
            "period_end": f.period_end.isoformat() if f.period_end else None,
            "items": items,
            "status": f.status.value,
            "published_at": f.published_at.isoformat() if f.published_at else None,
            "has_responded": existing_resp is not None,
            "response_id": existing_resp.id if existing_resp else None,
        })
    return response


@router.get("/forecasts/{forecast_id}")
async def get_forecast_detail(
    forecast_id: int,
    supplier_id: int = Query(1),
    db: AsyncSession = Depends(get_db)
):
    """供应商查看预测详情"""
    result = await db.execute(
        select(PurchaseForecast)
        .options(selectinload(PurchaseForecast.supplier))
        .where(PurchaseForecast.id == forecast_id)
    )
    forecast = result.scalar_one_or_none()
    if not forecast:
        raise HTTPException(status_code=404, detail="预测不存在")

    items = []
    if forecast.items_data:
        try:
            items = json.loads(forecast.items_data)
        except:
            items = []

    # Check for existing response
    resp_result = await db.execute(
        select(ForecastResponse)
        .where(ForecastResponse.forecast_id == forecast_id)
        .where(ForecastResponse.supplier_id == supplier_id)
    )
    existing_resp = resp_result.scalar_one_or_none()
    resp_data = None
    if existing_resp:
        try:
            resp_data = json.loads(existing_resp.response_data) if existing_resp.response_data else []
        except:
            resp_data = []

    return {
        "id": forecast.id,
        "forecast_period": forecast.forecast_period,
        "period_start": forecast.period_start.isoformat() if forecast.period_start else None,
        "period_end": forecast.period_end.isoformat() if forecast.period_end else None,
        "items": items,
        "status": forecast.status.value,
        "published_at": forecast.published_at.isoformat() if forecast.published_at else None,
        "has_responded": existing_resp is not None,
        "response": {
            "id": existing_resp.id,
            "items": resp_data,
            "risk_summary": existing_resp.risk_summary,
            "created_at": existing_resp.created_at.isoformat() if existing_resp.created_at else None,
        } if existing_resp else None,
    }


@router.post("/forecasts/{forecast_id}/respond")
async def submit_capacity_response(
    forecast_id: int,
    body: CapacityResponseCreate,
    db: AsyncSession = Depends(get_db)
):
    """供应商提交产能响应 (US-302)"""
    result = await db.execute(
        select(PurchaseForecast).where(PurchaseForecast.id == forecast_id)
    )
    forecast = result.scalar_one_or_none()
    if not forecast:
        raise HTTPException(status_code=404, detail="预测不存在")
    if forecast.status == ForecastStatus.EXPIRED:
        raise HTTPException(status_code=400, detail="预测已过期")

    # Check for existing response
    resp_result = await db.execute(
        select(ForecastResponse)
        .where(ForecastResponse.forecast_id == forecast_id)
        .where(ForecastResponse.supplier_id == body.supplier_id)
    )
    existing_resp = resp_result.scalar_one_or_none()

    response_data = [item.model_dump() for item in body.items]

    if existing_resp:
        existing_resp.response_data = json.dumps(response_data, ensure_ascii=False)
        existing_resp.risk_summary = body.risk_summary
        existing_resp.updated_at = datetime.utcnow()
        await db.flush()
        return {"success": True, "message": "产能响应已更新", "response_id": existing_resp.id}
    else:
        resp = ForecastResponse(
            forecast_id=forecast_id,
            supplier_id=body.supplier_id,
            response_data=json.dumps(response_data, ensure_ascii=False),
            risk_summary=body.risk_summary,
        )
        db.add(resp)
        await db.flush()
        await db.refresh(resp)
        return {"success": True, "message": "产能响应已提交", "response_id": resp.id}


# ==================== US-305/306: 要货计划 ====================

@router.get("/delivery-schedules")
async def list_delivery_schedules(
    supplier_id: int = Query(1),
    db: AsyncSession = Depends(get_db)
):
    """供应商查看要货计划列表"""
    query = (
        select(DeliverySchedule)
        .where(DeliverySchedule.supplier_id == supplier_id)
        .order_by(DeliverySchedule.required_date.desc())
    )
    result = await db.execute(query)
    schedules = result.scalars().all()

    response = []
    for s in schedules:
        items = []
        if s.items_data:
            try:
                items = json.loads(s.items_data)
            except:
                items = []

        # Get associated PO info
        po_result = await db.execute(
            select(PurchaseOrder).where(PurchaseOrder.id == s.po_id)
        )
        po = po_result.scalar_one_or_none()

        response.append({
            "id": s.id,
            "po_id": s.po_id,
            "po_number": po.order_number if po else None,
            "schedule_type": s.schedule_type,
            "required_date": s.required_date.isoformat() if s.required_date else None,
            "items": items,
            "status": s.status,
            "confirmed_at": s.confirmed_at.isoformat() if s.confirmed_at else None,
            "supplier_confirmed": bool(s.supplier_confirmed),
        })
    return response


@router.post("/delivery-schedules/{schedule_id}/confirm")
async def confirm_delivery_schedule(
    schedule_id: int,
    body: DeliveryScheduleConfirm,
    db: AsyncSession = Depends(get_db)
):
    """供应商确认/调整要货计划 (US-306)"""
    result = await db.execute(
        select(DeliverySchedule).where(DeliverySchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="要货计划不存在")

    if body.confirmed:
        schedule.supplier_confirmed = 1
        schedule.confirmed_at = datetime.utcnow()
    else:
        schedule.supplier_confirmed = 0

    if body.adjustment_notes:
        if hasattr(schedule, 'adjustment_notes'):
            schedule.adjustment_notes = body.adjustment_notes

    if body.adjusted_quantities:
        items = []
        if schedule.items_data:
            try:
                items = json.loads(schedule.items_data)
            except:
                items = []
        for idx, qty in body.adjusted_quantities.items():
            i = int(idx)
            if 0 <= i < len(items):
                items[i]['adjusted_qty'] = qty
        schedule.items_data = json.dumps(items, ensure_ascii=False)

    await db.flush()
    action = "确认" if body.confirmed else "已提交调整建议"
    return {"success": True, "message": f"要货计划{action}成功"}


# ==================== US-307: ASN 送货通知 ====================

@router.get("/asns")
async def list_asns(
    supplier_id: int = Query(1),
    db: AsyncSession = Depends(get_db)
):
    """供应商查看 ASN 列表"""
    query = (
        select(ASN)
        .where(ASN.supplier_id == supplier_id)
        .order_by(ASN.created_at.desc())
    )
    result = await db.execute(query)
    asns = result.scalars().all()

    response = []
    for a in asns:
        items = []
        if a.items_data:
            try:
                items = json.loads(a.items_data)
            except:
                items = []

        response.append({
            "id": a.id,
            "asn_no": a.asn_no,
            "po_id": a.po_id,
            "status": a.status.value if hasattr(a.status, 'value') else a.status,
            "carrier_name": a.carrier_name,
            "tracking_no": a.tracking_no,
            "items": items,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })
    return response


@router.post("/asns")
async def create_asn(
    body: ASNCreate,
    db: AsyncSession = Depends(get_db)
):
    """供应商创建 ASN 送货通知 (US-307)"""
    # Verify PO exists
    po_result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == body.po_id)
    )
    po = po_result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="采购订单不存在")

    # Generate ASN number
    asn_no = body.asn_no or f"ASN-{datetime.utcnow().strftime('%Y%m%d')}-{po.id:03d}"

    asn = ASN(
        asn_no=asn_no,
        po_id=body.po_id,
        supplier_id=body.supplier_id,
        schedule_id=body.delivery_schedule_id,
        carrier_name=body.carrier_name,
        carrier_contact=body.carrier_contact,
        tracking_no=body.tracking_no,
        items_data=json.dumps(body.items, ensure_ascii=False),
        status=ASNStatus.DRAFT,
    )
    db.add(asn)
    await db.flush()
    await db.refresh(asn)
    return {
        "success": True,
        "message": "ASN 送货通知已创建",
        "asn_id": asn.id,
        "asn_no": asn_no,
    }


@router.post("/asns/{asn_id}/submit")
async def submit_asn(
    asn_id: int,
    db: AsyncSession = Depends(get_db)
):
    """供应商提交 ASN（将状态从 draft 改为 submitted）"""
    result = await db.execute(
        select(ASN).where(ASN.id == asn_id)
    )
    asn = result.scalar_one_or_none()
    if not asn:
        raise HTTPException(status_code=404, detail="ASN不存在")

    if asn.status != ASNStatus.DRAFT:
        raise HTTPException(status_code=400, detail="只有草稿状态的ASN才能提交")

    asn.status = ASNStatus.SUBMITTED
    # submitted_at not in model, use updated_at
    asn.updated_at = datetime.utcnow()
    await db.flush()
    return {"success": True, "message": "ASN已提交，等待采购方确认"}
