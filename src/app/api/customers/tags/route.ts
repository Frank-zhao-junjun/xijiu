import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Tag } from '@/storage/database/shared/schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: '缺少客户ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customer_tags')
      .select('tag:tags(*)')
      .eq('customer_id', customerId);

    if (error) throw new Error(`获取客户标签失败: ${error.message}`);

    const tags = data?.map((item: Record<string, unknown>) => item.tag).filter(Boolean) || [];
    return NextResponse.json(tags as Tag[]);
  } catch (error) {
    console.error('获取客户标签失败:', error);
    return NextResponse.json({ error: '获取客户标签失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.customerId || !body.tagId) {
      return NextResponse.json({ error: '缺少客户ID或标签ID' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { error: insertError } = await client
      .from('customer_tags')
      .insert({
        id: `ct_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        customer_id: body.customerId,
        tag_id: body.tagId,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: '标签已存在' }, { status: 409 });
      }
      throw new Error(`添加标签失败: ${insertError.message}`);
    }

    const { data: tagData } = await client
      .from('tags')
      .select('usage_count')
      .eq('id', body.tagId)
      .single();

    if (tagData && tagData.usage_count !== undefined) {
      await client
        .from('tags')
        .update({ usage_count: tagData.usage_count + 1 })
        .eq('id', body.tagId);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('添加客户标签失败:', error);
    return NextResponse.json({ error: '添加客户标签失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const tagId = searchParams.get('tagId');

    if (!customerId || !tagId) {
      return NextResponse.json({ error: '缺少客户ID或标签ID' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { error } = await client
      .from('customer_tags')
      .delete()
      .eq('customer_id', customerId)
      .eq('tag_id', tagId);

    if (error) throw new Error(`移除标签失败: ${error.message}`);

    const { data: tagData } = await client
      .from('tags')
      .select('usage_count')
      .eq('id', tagId)
      .single();

    if (tagData && tagData.usage_count !== undefined && tagData.usage_count > 0) {
      await client
        .from('tags')
        .update({ usage_count: tagData.usage_count - 1 })
        .eq('id', tagId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('移除客户标签失败:', error);
    return NextResponse.json({ error: '移除客户标签失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.customerId || !body.tagIds) {
      return NextResponse.json({ error: '缺少客户ID或标签ID列表' }, { status: 400 });
    }

    const { customerId, tagIds } = body;
    const client = getSupabaseClient();

    const { data: existingTags } = await client
      .from('customer_tags')
      .select('tag_id')
      .eq('customer_id', customerId);

    const existingTagIds = new Set(existingTags?.map(t => t.tag_id) || []);
    const newTagIds = new Set(tagIds);

    const tagsToAdd = tagIds.filter((id: string) => !existingTagIds.has(id));
    const tagsToRemove = [...existingTagIds].filter(id => !newTagIds.has(id));

    if (tagsToRemove.length > 0) {
      await client
        .from('customer_tags')
        .delete()
        .eq('customer_id', customerId)
        .in('tag_id', tagsToRemove);

      for (const tagId of tagsToRemove) {
        const { data: tagData } = await client
          .from('tags')
          .select('usage_count')
          .eq('id', tagId)
          .single();

        if (tagData && tagData.usage_count !== undefined && tagData.usage_count > 0) {
          await client
            .from('tags')
            .update({ usage_count: tagData.usage_count - 1 })
            .eq('id', tagId);
        }
      }
    }

    if (tagsToAdd.length > 0) {
      const insertData = tagsToAdd.map((tagId: string) => ({
        id: `ct_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        customer_id: customerId,
        tag_id: tagId,
      }));

      await client.from('customer_tags').insert(insertData);

      for (const tagId of tagsToAdd) {
        const { data: tagData } = await client
          .from('tags')
          .select('usage_count')
          .eq('id', tagId)
          .single();

        if (tagData && tagData.usage_count !== undefined) {
          await client
            .from('tags')
            .update({ usage_count: tagData.usage_count + 1 })
            .eq('id', tagId);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新客户标签失败:', error);
    return NextResponse.json({ error: '更新客户标签失败' }, { status: 500 });
  }
}
