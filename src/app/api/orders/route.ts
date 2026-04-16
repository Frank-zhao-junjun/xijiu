// 成交订单 API

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

// 订单状态: draft | confirmed | awaiting_payment | paid | completed | cancelled

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const order = await db.getOrderById(id);
      if (!order) {
        return NextResponse.json({ error: '订单不存在' }, { status: 404 });
      }
      return NextResponse.json(order);
    }

    const orders = await db.getAllOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, id: bodyId } = body;
    const orderId = bodyId || data?.id;

    switch (action) {
      case 'create': {
        const order = await db.createOrder(
          {
            
            quote_id: data.quoteId || null,
            opportunity_id: data.opportunityId,
            customer_id: data.customerId,
            customer_name: data.customerName || null,
            status: 'draft',
            order_date: data.orderDate || null,
            delivery_date: data.deliveryDate || null,
            payment_method: data.paymentMethod || null,
            subtotal: String(data.subtotal || 0),
            discount: String(data.discount || 0),
            tax: String(data.tax || 0),
            total: String(data.total || 0),
            notes: data.notes || null,
          },
          (data.items || []).map((item: { productName: string; description?: string; quantity: number; unitPrice: number; discount?: number; subtotal: number }) => ({
            id: `oi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            product_name: item.productName,
            description: item.description || null,
            quantity: item.quantity,
            unit_price: String(item.unitPrice),
            discount: String(item.discount || 0),
            subtotal: String(item.subtotal),
          }))
        );
        return NextResponse.json(order);
      }

      // Status transitions
      case 'confirm': {
        const order = await db.updateOrder(orderId, { status: 'confirmed' });
        return NextResponse.json(order);
      }

      case 'awaiting_payment': {
        const order = await db.updateOrder(orderId, { status: 'awaiting_payment' });
        return NextResponse.json(order);
      }

      case 'paid': {
        const order = await db.updateOrder(orderId, { status: 'paid' });
        return NextResponse.json(order);
      }

      case 'complete': {
        const order = await db.updateOrder(orderId, { status: 'completed' });
        return NextResponse.json(order);
      }

      case 'cancel': {
        const order = await db.updateOrder(orderId, { status: 'cancelled' });
        return NextResponse.json(order);
      }

      // Legacy support
      case 'fulfill': {
        const order = await db.updateOrder(orderId, { status: 'completed' });
        return NextResponse.json(order);
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, data } = body;

    const updates: Record<string, unknown> = {};
    if (data.status !== undefined) updates.status = data.status;
    if (data.orderDate !== undefined) updates.order_date = data.orderDate;
    if (data.deliveryDate !== undefined) updates.delivery_date = data.deliveryDate;
    if (data.paymentMethod !== undefined) updates.payment_method = data.paymentMethod;
    if (data.subtotal !== undefined) updates.subtotal = String(data.subtotal);
    if (data.discount !== undefined) updates.discount = String(data.discount);
    if (data.tax !== undefined) updates.tax = String(data.tax);
    if (data.total !== undefined) updates.total = String(data.total);
    if (data.notes !== undefined) updates.notes = data.notes;

    const order = await db.updateOrder(id, updates);
    return NextResponse.json(order);
  } catch (error) {
    console.error('Orders PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

    await db.deleteOrder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Orders DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
