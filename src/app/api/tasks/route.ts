// 任务管理 API

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const filter = searchParams.get('filter');

    if (id) {
      const task = await db.getTaskById(id);
      if (!task) {
        return NextResponse.json({ error: '任务不存在' }, { status: 404 });
      }
      return NextResponse.json(task);
    }

    if (entityType && entityId) {
      const tasks = await db.getTasksByEntity(entityType, entityId);
      return NextResponse.json(tasks);
    }

    if (filter === 'pending') {
      const tasks = await db.getPendingTasks();
      return NextResponse.json(tasks);
    }

    if (filter === 'today') {
      const tasks = await db.getTodayTasks();
      return NextResponse.json(tasks);
    }

    if (filter === 'overdue') {
      const tasks = await db.getOverdueTasks();
      return NextResponse.json(tasks);
    }

    const tasks = await db.getAllTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create': {
        const task = await db.createTask({
          id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          title: data.title,
          description: data.description || null,
          entity_type: data.entityType || null,
          entity_id: data.entityId || null,
          entity_name: data.entityName || null,
          priority: data.priority || 'medium',
          status: 'pending',
          due_date: data.dueDate || null,
          source: 'manual',
          workflow_id: null,
          assigned_to: data.assignedTo || 'sales_a',
        } as unknown as Parameters<typeof db.createTask>[0]);

        // Record activity
        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'created',
          entity_type: (data.entityType as 'customer' | 'contact' | 'lead' | 'opportunity') || 'customer',
          entity_id: data.entityId || task.id,
          entity_name: data.entityName || data.title,
          description: `创建任务: ${data.title}`,
          timestamp: new Date(),
        });

        return NextResponse.json(task);
      }

      case 'complete': {
        const taskId = data.id || body.id;
        const task = await db.completeTask(taskId);
        const row = task as Record<string, unknown>;

        await db.createActivity({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'updated',
          entity_type:
            (row.entity_type as 'customer' | 'contact' | 'lead' | 'opportunity' | 'product') || 'customer',
          entity_id: String(row.entity_id ?? row.id ?? taskId),
          entity_name: String(row.entity_name ?? row.title ?? ''),
          description: `完成任务: ${String(row.title ?? '')}`,
          timestamp: new Date(),
        });

        return NextResponse.json(task);
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, data } = body;

    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.entityType !== undefined) updates.entity_type = data.entityType;
    if (data.entityId !== undefined) updates.entity_id = data.entityId;
    if (data.entityName !== undefined) updates.entity_name = data.entityName;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.status !== undefined) {
      updates.status = data.status;
      if (data.status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
    }
    if (data.dueDate !== undefined) updates.due_date = data.dueDate;
    if (data.assignedTo !== undefined) updates.assigned_to = data.assignedTo;

    const task = await db.updateTask(id, updates);
    return NextResponse.json(task);
  } catch (error) {
    console.error('Tasks PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

    await db.deleteTask(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tasks DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
