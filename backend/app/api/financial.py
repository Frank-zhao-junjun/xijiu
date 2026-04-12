"""财务管理 API - 结算单/发票/付款"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

from app.core.database import get_db
from app.models.supply_chain import (
    SettlementStatement, Invoice, Payment,
    Supplier, PurchaseOrder, Receipt
)

router = APIRouter(prefix="/financial", tags=["财务管理"])


# ==================== Schemas ====================

class SettlementStatementCreate(BaseModel):
    statement_no: Optional[str] = None
    supplier_id: int
    period_start: datetime
    period_end: datetime
    total_amount: float
    remarks: Optional[str] = None


class SettlementStatementResponse(BaseModel):
    id: int
    statement_no: str
    supplier_id: int
    supplier_name: Optional[str] = None
    period_start: datetime
    period_end: datetime
    total_amount: float
    paid_amount: float
    unpaid_amount: float
    status: str
    confirmed_at: Optional[datetime]
    confirmed_by: Optional[str]
    remarks: Optional[str]
    created_at: datetime


class InvoiceCreate(BaseModel):
    invoice_no: Optional[str] = None
    statement_id: Optional[int] = None
    supplier_id: int
    amount: float
    tax_amount: float
    invoice_type: str = "VAT_SPECIAL"  # VAT_SPECIAL/VA T_NORMAL
    invoice_date: Optional[datetime] = None
    remarks: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: int
    invoice_no: str
    statement_id: Optional[int]
    supplier_id: int
    supplier_name: Optional[str] = None
    amount: float
    tax_amount: float
    total_amount: float
    invoice_type: str
    invoice_date: Optional[datetime]
    status: str
    remarks: Optional[str]
    created_at: datetime


class PaymentCreate(BaseModel):
    payment_no: Optional[str] = None
    invoice_id: Optional[int] = None
    statement_id: Optional[int] = None
    supplier_id: int
    amount: float
    payment_method: str = "bank_transfer"
    expected_date: Optional[datetime] = None
    remarks: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    payment_no: str
    invoice_id: Optional[int]
    statement_id: Optional[int]
    supplier_id: int
    supplier_name: Optional[str] = None
    amount: float
    payment_method: str
    expected_date: Optional[datetime]
    actual_date: Optional[datetime]
    status: str
    pre_payment: bool
    remarks: Optional[str]
    created_at: datetime


# ==================== 结算单接口 ====================

@router.get("/statements/", response_model=List[SettlementStatementResponse])
async def list_statements(
    status: Optional[str] = Query(None, description="draft/confirmed/paid/partial"),
    supplier_id: Optional[int] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """获取结算单列表"""
    query = select(SettlementStatement).options(selectinload(SettlementStatement.supplier))
    
    if status:
        query = query.where(SettlementStatement.status == status)
    if supplier_id:
        query = query.where(SettlementStatement.supplier_id == supplier_id)
    if keyword:
        query = query.where(SettlementStatement.statement_no.contains(keyword))
    
    query = query.order_by(desc(SettlementStatement.created_at))
    
    result = await db.execute(query)
    statements = result.scalars().all()
    
    return [_format_statement(s) for s in statements]


@router.get("/statements/{statement_id}", response_model=SettlementStatementResponse)
async def get_statement(
    statement_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取结算单详情"""
    result = await db.execute(
        select(SettlementStatement).options(
            selectinload(SettlementStatement.supplier)
        ).where(SettlementStatement.id == statement_id)
    )
    statement = result.scalar_one_or_none()
    if not statement:
        raise HTTPException(status_code=404, detail="结算单不存在")
    return _format_statement(statement)


@router.post("/statements/", response_model=SettlementStatementResponse)
async def create_statement(
    data: SettlementStatementCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建结算单（采购方发起对账）"""
    statement_no = data.statement_no or f"SS{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    statement = SettlementStatement(
        statement_no=statement_no,
        supplier_id=data.supplier_id,
        period_start=data.period_start,
        period_end=data.period_end,
        total_amount=data.total_amount,
        status="draft",
        remarks=data.remarks,
    )
    db.add(statement)
    await db.commit()
    await db.refresh(statement)
    
    # 重新查询获取关联数据
    result = await db.execute(
        select(SettlementStatement).options(
            selectinload(SettlementStatement.supplier)
        ).where(SettlementStatement.id == statement.id)
    )
    return _format_statement(result.scalar_one())


@router.post("/statements/{statement_id}/confirm")
async def confirm_statement(
    statement_id: int,
    confirmed_by: str = Query("采购员"),
    db: AsyncSession = Depends(get_db)
):
    """供应商确认结算单"""
    result = await db.execute(
        select(SettlementStatement).where(SettlementStatement.id == statement_id)
    )
    statement = result.scalar_one_or_none()
    if not statement:
        raise HTTPException(status_code=404, detail="结算单不存在")
    
    statement.status = "confirmed"
    statement.confirmed_at = datetime.utcnow()
    statement.confirmed_by = confirmed_by
    await db.commit()
    
    return {"success": True, "message": "结算单已确认"}


@router.get("/statements/stats/summary")
async def get_statement_stats(
    db: AsyncSession = Depends(get_db)
):
    """获取结算统计"""
    # 待对账
    draft_result = await db.execute(
        select(func.count(), func.sum(SettlementStatement.total_amount))
        .where(SettlementStatement.status == "draft")
    )
    draft_count, draft_amount = draft_result.one()
    
    # 已确认待付款
    confirmed_result = await db.execute(
        select(func.count(), func.sum(SettlementStatement.total_amount))
        .where(SettlementStatement.status == "confirmed")
    )
    confirmed_count, confirmed_amount = confirmed_result.one()
    
    # 已付款
    paid_result = await db.execute(
        select(func.count(), func.sum(SettlementStatement.total_amount))
        .where(SettlementStatement.status == "paid")
    )
    paid_count, paid_amount = paid_result.one()
    
    return {
        "draft_count": draft_count or 0,
        "draft_amount": float(draft_amount or 0),
        "confirmed_count": confirmed_count or 0,
        "confirmed_amount": float(confirmed_amount or 0),
        "paid_count": paid_count or 0,
        "paid_amount": float(paid_amount or 0),
    }


# ==================== 发票接口 ====================

@router.get("/invoices/", response_model=List[InvoiceResponse])
async def list_invoices(
    status: Optional[str] = Query(None),
    supplier_id: Optional[int] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """获取发票列表"""
    query = select(Invoice).options(selectinload(Invoice.supplier))
    
    if status:
        query = query.where(Invoice.status == status)
    if supplier_id:
        query = query.where(Invoice.supplier_id == supplier_id)
    if keyword:
        query = query.where(Invoice.invoice_no.contains(keyword))
    
    query = query.order_by(desc(Invoice.created_at))
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    return [_format_invoice(i) for i in invoices]


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取发票详情"""
    result = await db.execute(
        select(Invoice).options(
            selectinload(Invoice.supplier)
        ).where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="发票不存在")
    return _format_invoice(invoice)


@router.post("/invoices/", response_model=InvoiceResponse)
async def create_invoice(
    data: InvoiceCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建发票"""
    invoice_no = data.invoice_no or f"INV{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    invoice = Invoice(
        invoice_no=invoice_no,
        statement_id=data.statement_id,
        supplier_id=data.supplier_id,
        amount=data.amount,
        tax_amount=data.tax_amount,
        invoice_type=data.invoice_type,
        invoice_date=data.invoice_date or datetime.utcnow(),
        status="issued",
        remarks=data.remarks,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    
    result = await db.execute(
        select(Invoice).options(
            selectinload(Invoice.supplier)
        ).where(Invoice.id == invoice.id)
    )
    return _format_invoice(result.scalar_one())


@router.get("/invoices/stats/summary")
async def get_invoice_stats(
    db: AsyncSession = Depends(get_db)
):
    """获取发票统计"""
    # 待开票
    issued_result = await db.execute(
        select(func.count(), func.sum(Invoice.amount + Invoice.tax_amount))
        .where(Invoice.status == "issued")
    )
    issued_count, issued_amount = issued_result.one()
    
    # 已认证
    verified_result = await db.execute(
        select(func.count(), func.sum(Invoice.amount + Invoice.tax_amount))
        .where(Invoice.status == "verified")
    )
    verified_count, verified_amount = verified_result.one()
    
    return {
        "issued_count": issued_count or 0,
        "issued_amount": float(issued_amount or 0),
        "verified_count": verified_count or 0,
        "verified_amount": float(verified_amount or 0),
    }


# ==================== 付款接口 ====================

@router.get("/payments/", response_model=List[PaymentResponse])
async def list_payments(
    status: Optional[str] = Query(None),
    supplier_id: Optional[int] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """获取付款记录列表"""
    query = select(Payment).options(selectinload(Payment.supplier))
    
    if status:
        query = query.where(Payment.status == status)
    if supplier_id:
        query = query.where(Payment.supplier_id == supplier_id)
    if keyword:
        query = query.where(Payment.payment_no.contains(keyword))
    
    query = query.order_by(desc(Payment.created_at))
    
    result = await db.execute(query)
    payments = result.scalars().all()
    
    return [_format_payment(p) for p in payments]


@router.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取付款记录详情"""
    result = await db.execute(
        select(Payment).options(
            selectinload(Payment.supplier)
        ).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="付款记录不存在")
    return _format_payment(payment)


@router.post("/payments/", response_model=PaymentResponse)
async def create_payment(
    data: PaymentCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建付款申请"""
    payment_no = data.payment_no or f"PAY{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    payment = Payment(
        payment_no=payment_no,
        invoice_id=data.invoice_id,
        statement_id=data.statement_id,
        supplier_id=data.supplier_id,
        amount=data.amount,
        payment_method=data.payment_method,
        expected_date=data.expected_date or (datetime.utcnow() + timedelta(days=30)),
        status="applied",
        pre_payment=0,
        remarks=data.remarks,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    
    result = await db.execute(
        select(Payment).options(
            selectinload(Payment.supplier)
        ).where(Payment.id == payment.id)
    )
    return _format_payment(result.scalar_one())


@router.post("/payments/{payment_id}/approve")
async def approve_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db)
):
    """审批通过付款申请"""
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="付款记录不存在")
    
    payment.status = "approved"
    await db.commit()
    
    return {"success": True, "message": "付款申请已审批通过"}


@router.post("/payments/{payment_id}/pay")
async def confirm_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db)
):
    """确认付款完成"""
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="付款记录不存在")
    
    payment.status = "paid"
    payment.actual_date = datetime.utcnow()
    await db.commit()
    
    return {"success": True, "message": "付款已完成"}


@router.get("/payments/stats/summary")
async def get_payment_stats(
    db: AsyncSession = Depends(get_db)
):
    """获取付款统计"""
    # 申请中
    applied_result = await db.execute(
        select(func.count(), func.sum(Payment.amount))
        .where(Payment.status == "applied")
    )
    applied_count, applied_amount = applied_result.one()
    
    # 已批准待付
    approved_result = await db.execute(
        select(func.count(), func.sum(Payment.amount))
        .where(Payment.status == "approved")
    )
    approved_count, approved_amount = approved_result.one()
    
    # 已付款
    paid_result = await db.execute(
        select(func.count(), func.sum(Payment.amount))
        .where(Payment.status == "paid")
    )
    paid_count, paid_amount = paid_result.one()
    
    return {
        "applied_count": applied_count or 0,
        "applied_amount": float(applied_amount or 0),
        "approved_count": approved_count or 0,
        "approved_amount": float(approved_amount or 0),
        "paid_count": paid_count or 0,
        "paid_amount": float(paid_amount or 0),
    }


# ==================== 辅助函数 ====================

def _format_statement(s: SettlementStatement) -> dict:
    """格式化结算单"""
    return {
        "id": s.id,
        "statement_no": s.statement_no,
        "supplier_id": s.supplier_id,
        "supplier_name": s.supplier.name if s.supplier else None,
        "period_start": s.period_start,
        "period_end": s.period_end,
        "total_amount": s.total_amount,
        "paid_amount": s.paid_amount or 0,
        "unpaid_amount": s.total_amount - (s.paid_amount or 0),
        "status": s.status,
        "confirmed_at": s.confirmed_at,
        "confirmed_by": s.confirmed_by,
        "remarks": s.remarks,
        "created_at": s.created_at,
    }


def _format_invoice(i: Invoice) -> dict:
    """格式化发票"""
    return {
        "id": i.id,
        "invoice_no": i.invoice_no,
        "statement_id": i.statement_id,
        "supplier_id": i.supplier_id,
        "supplier_name": i.supplier.name if i.supplier else None,
        "amount": i.amount,
        "tax_amount": i.tax_amount,
        "total_amount": i.amount + i.tax_amount,
        "invoice_type": i.invoice_type,
        "invoice_date": i.invoice_date,
        "status": i.status,
        "remarks": i.remarks,
        "created_at": i.created_at,
    }


def _format_payment(p: Payment) -> dict:
    """格式化付款记录"""
    return {
        "id": p.id,
        "payment_no": p.payment_no,
        "invoice_id": p.invoice_id,
        "statement_id": p.statement_id,
        "supplier_id": p.supplier_id,
        "supplier_name": p.supplier.name if p.supplier else None,
        "amount": p.amount,
        "payment_method": p.payment_method,
        "expected_date": p.expected_date,
        "actual_date": p.actual_date,
        "status": p.status,
        "pre_payment": bool(p.pre_payment),
        "remarks": p.remarks,
        "created_at": p.created_at,
    }
