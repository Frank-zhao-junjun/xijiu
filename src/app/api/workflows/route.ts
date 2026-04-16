// 工作流自动化 API

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const triggerType = searchParams.get('triggerType');
    const includeLogs = searchParams.get('includeLogs') === 'true';

    if (id) {
      const workflow = await db.getWorkflowById(id);
      if (!workflow) {
        return NextResponse.json({ error: '工作流不存在' }, { status: 404 });
      }
      let logs: Awaited<ReturnType<typeof db.getWorkflowLogs>> = [];
      if (includeLogs) {
        logs = await db.getWorkflowLogs(id, 20);
      }
      return NextResponse.json({ ...workflow, logs });
    }

    if (triggerType) {
      const workflows = await db.getActiveWorkflowsByTrigger(triggerType);
      return NextResponse.json(workflows);
    }

    const workflows = await db.getAllWorkflows();
    
    // Get recent workflow logs
    const recentLogs = await db.getWorkflowLogs(undefined, 10);

    return NextResponse.json({ workflows, recentLogs });
  } catch (error) {
    console.error('Workflows GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create': {
        const workflow = await db.createWorkflow({
          id: `wf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: data.name,
          description: data.description || null,
          trigger_type: data.triggerType,
          trigger_entity: data.triggerEntity || data.triggerType.split('_')[0] || 'lead',
          conditions: typeof data.conditions === 'string' ? data.conditions : JSON.stringify(data.conditions || {}),
          actions: typeof data.actions === 'string' ? data.actions : JSON.stringify(data.actions || []),
          is_active: data.isActive ?? true,
          is_template: false,
          run_count: 0,
        });
        return NextResponse.json(workflow);
      }

      case 'seedTemplates': {
        await db.seedWorkflowTemplates();
        return NextResponse.json({ success: true, message: '模板已初始化' });
      }

      case 'execute': {
        // Manually trigger a workflow execution for testing
        const executedCount = await db.executeWorkflowEngine({
          triggerType: data.triggerType,
          entityType: data.entityType,
          entityId: data.entityId,
          entityName: data.entityName,
          data: data.data,
        });
        return NextResponse.json({ success: true, executedCount });
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Workflows POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, data } = body;

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.triggerType !== undefined) updates.trigger_type = data.triggerType;
    if (data.triggerEntity !== undefined) updates.trigger_entity = data.triggerEntity;
    if (data.conditions !== undefined) updates.conditions = typeof data.conditions === 'string' ? data.conditions : JSON.stringify(data.conditions);
    if (data.actions !== undefined) updates.actions = typeof data.actions === 'string' ? data.actions : JSON.stringify(data.actions);
    if (data.isActive !== undefined) updates.is_active = data.isActive;

    const workflow = await db.updateWorkflow(id, updates);
    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Workflows PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

    await db.deleteWorkflow(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Workflows DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
