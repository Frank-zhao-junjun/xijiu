import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplateById, updateEmailTemplate, deleteEmailTemplate } from '@/lib/crm-email';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const template = await getEmailTemplateById(id);
    
    if (!template) {
      return NextResponse.json({ error: '邮件模板不存在' }, { status: 404 });
    }
    
    return NextResponse.json(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取邮件模板失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.body !== undefined) updateData.body = body.body;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.variables !== undefined) updateData.variables = JSON.stringify(body.variables);
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    
    const template = await updateEmailTemplate(id, updateData);
    return NextResponse.json(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新邮件模板失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteEmailTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除邮件模板失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
