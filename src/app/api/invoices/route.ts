import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// 发票数据存储（内存）
const invoices: Record<string, Record<string, unknown>> = {};
let invoiceCounter = 0;

function generateInvoiceNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  invoiceCounter++;
  return `INV-${y}${m}${d}-${String(invoiceCounter).padStart(4, '0')}`;
}

function getInvoices(): Record<string, unknown>[] {
  return Object.values(invoices).sort((a, b) => 
    new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
  );
}

function getInvoiceById(id: string): Record<string, unknown> | null {
  return invoices[id] || null;
}

function createInvoice(data: Record<string, unknown>): Record<string, unknown> {
  const id = nanoid();
  const now = new Date().toISOString();
  const invoice: Record<string, unknown> = {
    id,
    invoice_number: generateInvoiceNumber(),
    order_id: data.orderId || null,
    order_number: data.orderNumber || null,
    customer_id: data.customerId,
    customer_name: data.customerName,
    tax_id: data.taxId || null,
    billing_address: data.billingAddress || null,
    status: data.status || 'draft',
    issue_date: data.issueDate || now.split('T')[0],
    due_date: data.dueDate || null,
    subtotal: Number(data.subtotal) || 0,
    tax_rate: Number(data.taxRate) || 0.06,
    tax: Number(data.tax) || 0,
    total: Number(data.total) || 0,
    paid_date: data.paidDate || null,
    payment_method: data.paymentMethod || null,
    notes: data.notes || null,
    created_at: now,
    updated_at: now,
  };
  invoices[id] = invoice;
  return invoice;
}

function updateInvoice(id: string, updates: Record<string, unknown>): Record<string, unknown> | null {
  if (!invoices[id]) return null;
  invoices[id] = {
    ...invoices[id],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return invoices[id];
}

function deleteInvoice(id: string): boolean {
  if (!invoices[id]) return false;
  delete invoices[id];
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const invoice = getInvoiceById(id);
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      return NextResponse.json(invoice);
    }
    
    return NextResponse.json(getInvoices());
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    if (action === 'create') {
      const invoice = createInvoice(data);
      return NextResponse.json(invoice, { status: 201 });
    }
    
    if (action === 'update') {
      const invoice = updateInvoice(data.id, data);
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      return NextResponse.json(invoice);
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const deleted = deleteInvoice(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
