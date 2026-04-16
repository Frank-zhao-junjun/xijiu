import { NextRequest, NextResponse } from 'next/server';
import { getAllEmailConfigs, createEmailConfig } from '@/lib/crm-email';

export async function GET() {
  try {
    const configs = await getAllEmailConfigs();
    return NextResponse.json(configs);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取邮件配置失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const config = await createEmailConfig({
      id: crypto.randomUUID(),
      name: body.name,
      host: body.host,
      port: body.port || 587,
      secure: body.secure || false,
      username: body.username,
      password: body.password,
      from_name: body.from_name,
      from_email: body.from_email,
      is_default: body.is_default || false,
    });
    
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建邮件配置失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
