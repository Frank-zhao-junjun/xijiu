import { NextRequest, NextResponse } from 'next/server';
import { getAllEmailTemplates, createEmailTemplate } from '@/lib/crm-email';

export async function GET() {
  try {
    const templates = await getAllEmailTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取邮件模板失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const template = await createEmailTemplate({
      id: crypto.randomUUID(),
      name: body.name,
      subject: body.subject,
      body: body.body,
      category: body.category || 'general',
      variables: JSON.stringify(body.variables || []),
      is_active: body.is_active !== false,
    });
    
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建邮件模板失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
