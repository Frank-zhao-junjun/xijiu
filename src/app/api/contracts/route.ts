// 合同管理 API

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const customerId = searchParams.get('customerId');
    const opportunityId = searchParams.get('opportunityId');
    const quoteId = searchParams.get('quoteId');

    if (id) {
      const contract = await db.getContractById(id);
      if (!contract) {
        return NextResponse.json({ error: '合同不存在' }, { status: 404 });
      }
      // 获取履约节点
      const milestones = await db.getMilestonesByContract(id);
      return NextResponse.json({ ...contract, milestones });
    }

    if (customerId) {
      const contracts = await db.getContractsByCustomer(customerId);
      return NextResponse.json(contracts);
    }

    if (opportunityId) {
      const contracts = await db.getContractsByOpportunity(opportunityId);
      return NextResponse.json(contracts);
    }

    if (quoteId) {
      const contracts = await db.getContractsByQuote(quoteId);
      return NextResponse.json(contracts);
    }

    const contracts = await db.getAllContracts();
    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Contracts GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, id: bodyId } = body;

    switch (action) {
      case 'create': {
        // 生成合同编号
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const contractNumber = data.contractNumber || `CT${timestamp}${random}`;
        
        // 处理日期字段
        const processDate = (dateStr: string | undefined) => {
          if (!dateStr) return null;
          return new Date(dateStr).toISOString();
        };
        
        const contract = await db.createContract(
          {
            id: data.id || `contract_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            contract_number: contractNumber,
            customer_id: data.customerId || null,
            customer_name: data.customerName || null,
            opportunity_id: data.opportunityId || null,
            opportunity_name: data.opportunityName || null,
            quote_id: data.quoteId || null,
            quote_title: data.quoteTitle || null,
            status: data.status || 'draft',
            amount: String(data.amount || 0),
            signing_date: processDate(data.signingDate) as unknown as Date,
            effective_date: processDate(data.effectiveDate) as unknown as Date,
            expiration_date: processDate(data.expirationDate) as unknown as Date,
            terms: data.terms || null,
            custom_terms: data.customTerms || null,
            notes: data.notes || null,
          },
          (data.milestones || []).map((m: { name: string; description?: string; expectedDate?: string; sortOrder?: number }, idx: number) => ({
            id: `milestone_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${idx}`,
            name: m.name,
            description: m.description || null,
            expected_date: processDate(m.expectedDate),
            is_completed: false,
            sort_order: m.sortOrder || idx,
          }))
        );
        return NextResponse.json(contract);
      }

      case 'createFromQuote': {
        const contract = await db.createContractFromQuote(data.quoteId, {
          effective_date: data.effectiveDate ? new Date(data.effectiveDate).toISOString() as unknown as Date : null,
          expiration_date: data.expirationDate ? new Date(data.expirationDate).toISOString() as unknown as Date : null,
          terms: data.terms || null,
          custom_terms: data.customTerms || null,
          notes: data.notes || null,
        });
        return NextResponse.json(contract);
      }

      case 'update': {
        const processDate = (dateStr: string | undefined) => {
          if (!dateStr) return null;
          return new Date(dateStr).toISOString();
        };
        
        const contract = await db.updateContract(bodyId || data?.id, {
          customer_id: data.customerId,
          customer_name: data.customerName,
          opportunity_id: data.opportunityId,
          opportunity_name: data.opportunityName,
          quote_id: data.quoteId,
          quote_title: data.quoteTitle,
          status: data.status,
          amount: data.amount !== undefined ? String(data.amount) : undefined,
          signing_date: processDate(data.signingDate) as unknown as Date,
          effective_date: processDate(data.effectiveDate) as unknown as Date,
          expiration_date: processDate(data.expirationDate) as unknown as Date,
          terms: data.terms,
          custom_terms: data.customTerms,
          notes: data.notes,
        });
        return NextResponse.json(contract);
      }

      case 'start': {
        // 草稿 → 执行中
        const contract = await db.updateContract(bodyId || data?.id, { status: 'executing' });
        return NextResponse.json(contract);
      }

      case 'complete': {
        // 执行中 → 已完成
        const contract = await db.updateContract(bodyId || data?.id, { status: 'completed' });
        return NextResponse.json(contract);
      }

      case 'terminate': {
        // 任何状态 → 已终止
        const contract = await db.updateContract(bodyId || data?.id, { status: 'terminated' });
        return NextResponse.json(contract);
      }

      case 'delete': {
        await db.deleteContract(bodyId || data?.id);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Contracts POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// DELETE method for backward compatibility
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '缺少合同ID' }, { status: 400 });
    }
    
    await db.deleteContract(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contracts DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
