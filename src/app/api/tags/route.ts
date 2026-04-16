import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Tag, InsertTag } from '@/storage/database/shared/schema';

const generateId = () => `tag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('tags')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('name');

    if (error) throw new Error(`获取标签失败: ${error.message}`);
    return NextResponse.json(data as Tag[]);
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json({ error: '获取标签失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: '标签名称不能为空' }, { status: 400 });
    }

    if (body.name.length > 64) {
      return NextResponse.json({ error: '标签名称不能超过64个字符' }, { status: 400 });
    }

    const validColors = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#6B7280'];
    const color = validColors.includes(body.color) ? body.color : '#6B7280';

    const tag: InsertTag = {
      id: generateId(),
      name: body.name.trim(),
      color,
      icon: body.icon || 'tag',
      description: body.description || null,
      usage_count: 0,
    };

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('tags')
      .insert(tag)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '标签名称已存在' }, { status: 409 });
      }
      throw new Error(`创建标签失败: ${error.message}`);
    }

    return NextResponse.json(data as Tag, { status: 201 });
  } catch (error) {
    console.error('创建标签失败:', error);
    return NextResponse.json({ error: '创建标签失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: '缺少标签ID' }, { status: 400 });
    }

    if (body.name !== undefined) {
      if (body.name.trim().length === 0) {
        return NextResponse.json({ error: '标签名称不能为空' }, { status: 400 });
      }
      if (body.name.length > 64) {
        return NextResponse.json({ error: '标签名称不能超过64个字符' }, { status: 400 });
      }
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.color !== undefined) {
      const validColors = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#6B7280'];
      updates.color = validColors.includes(body.color) ? body.color : '#6B7280';
    }
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.description !== undefined) updates.description = body.description;

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('tags')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '标签名称已存在' }, { status: 409 });
      }
      throw new Error(`更新标签失败: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 });
    }

    return NextResponse.json(data as Tag);
  } catch (error) {
    console.error('更新标签失败:', error);
    return NextResponse.json({ error: '更新标签失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('id');

    if (!tagId) {
      return NextResponse.json({ error: '缺少标签ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { error } = await client
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) throw new Error(`删除标签失败: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除标签失败:', error);
    return NextResponse.json({ error: '删除标签失败' }, { status: 500 });
  }
}
