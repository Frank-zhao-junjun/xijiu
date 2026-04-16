import { NextRequest, NextResponse } from 'next/server';
import { getEmailConfigById, updateEmailConfig, deleteEmailConfig, testEmailConfig } from '@/lib/crm-email';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const config = await getEmailConfigById(id);
    
    if (!config) {
      return NextResponse.json({ error: '邮件配置不存在' }, { status: 404 });
    }
    
    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取邮件配置失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const config = await updateEmailConfig(id, {
      name: body.name,
      host: body.host,
      port: body.port,
      secure: body.secure,
      username: body.username,
      password: body.password,
      from_name: body.from_name,
      from_email: body.from_email,
      is_default: body.is_default,
    });
    
    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新邮件配置失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteEmailConfig(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除邮件配置失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 测试邮件配置
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const testEmail = body.test_email;
    
    if (!testEmail) {
      return NextResponse.json({ error: '请提供测试邮箱地址' }, { status: 400 });
    }
    
    const result = await testEmailConfig(id, testEmail);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '测试邮件配置失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
