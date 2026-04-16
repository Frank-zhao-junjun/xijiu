// 合同履约节点 API

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contractId = searchParams.get('contractId');
    const id = searchParams.get('id');

    if (id) {
      // Get single milestone
      const milestones = await db.getMilestonesByContract('');
      const milestone = milestones.find(m => m.id === id);
      if (!milestone) {
        return NextResponse.json({ error: '履约节点不存在' }, { status: 404 });
      }
      return NextResponse.json(milestone);
    }

    if (contractId) {
      const milestones = await db.getMilestonesByContract(contractId);
      return NextResponse.json(milestones);
    }

    return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  } catch (error) {
    console.error('Milestones GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, id: bodyId } = body;

    switch (action) {
      case 'create': {
        const processDate = (dateStr: string | undefined) => {
          if (!dateStr) return null;
          return new Date(dateStr).toISOString();
        };
        
        const milestone = await db.createMilestone({
          id: data.id || `milestone_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          contract_id: data.contractId,
          name: data.name,
          description: data.description || null,
          expected_date: processDate(data.expectedDate) as unknown as Date,
          is_completed: false,
          sort_order: data.sortOrder || 0,
        });
        return NextResponse.json(milestone);
      }

      case 'complete': {
        const milestone = await db.completeMilestone(bodyId || data?.id);
        return NextResponse.json(milestone);
      }

      case 'update': {
        const processDate = (dateStr: string | undefined) => {
          if (!dateStr) return null;
          return new Date(dateStr).toISOString();
        };
        
        const milestone = await db.updateMilestone(bodyId || data?.id, {
          name: data.name,
          description: data.description,
          expected_date: processDate(data.expectedDate) as unknown as Date,
          sort_order: data.sortOrder,
        });
        return NextResponse.json(milestone);
      }

      case 'delete': {
        await db.deleteMilestone(bodyId || data?.id);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Milestones POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '缺少节点ID' }, { status: 400 });
    }
    
    await db.deleteMilestone(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Milestones DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
