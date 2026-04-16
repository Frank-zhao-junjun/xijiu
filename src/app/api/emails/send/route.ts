import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/crm-email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.to_email) {
      return NextResponse.json({ error: '收件人邮箱不能为空' }, { status: 400 });
    }
    
    if (!body.subject) {
      return NextResponse.json({ error: '邮件主题不能为空' }, { status: 400 });
    }
    
    const result = await sendEmail({
      configId: body.config_id,
      templateId: body.template_id,
      entityType: body.entity_type,
      entityId: body.entity_id,
      entityName: body.entity_name,
      toEmail: body.to_email,
      toName: body.to_name,
      subject: body.subject,
      body: body.body || '',
      variables: body.variables,
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送邮件失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
