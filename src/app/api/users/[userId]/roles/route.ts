// 用户角色管理 API 路由
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { clearPermissionCache } from '@/lib/permissions';

// 获取用户角色列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const client = getSupabaseClient();
    
    // 获取用户的角色
    const { data: userRoles, error: userRolesError } = await client
      .from('user_roles')
      .select(`
        id,
        user_id,
        created_at,
        roles (
          id,
          name,
          description,
          is_system
        )
      `)
      .eq('user_id', userId);
    
    if (userRolesError) {
      console.error('获取用户角色失败:', userRolesError);
      return NextResponse.json(
        { error: '获取用户角色失败' },
        { status: 500 }
      );
    }
    
    // 格式化返回数据
    const formattedUserRoles = userRoles?.map((ur: Record<string, unknown>) => ({
      id: ur.id,
      user_id: ur.user_id,
      created_at: ur.created_at,
      ...((Array.isArray(ur.roles) ? ur.roles[0] : ur.roles) as Record<string, unknown> || {}),
    })) || [];
    
    return NextResponse.json(formattedUserRoles);
  } catch (error) {
    console.error('获取用户角色失败:', error);
    return NextResponse.json(
      { error: '获取用户角色失败' },
      { status: 500 }
    );
  }
}

// 分配用户角色
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { role_id } = body;
    
    if (!role_id) {
      return NextResponse.json(
        { error: '角色ID不能为空' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 检查角色是否存在
    const { data: role, error: roleError } = await client
      .from('roles')
      .select('id')
      .eq('id', role_id)
      .maybeSingle();
    
    if (roleError || !role) {
      return NextResponse.json(
        { error: '角色不存在' },
        { status: 404 }
      );
    }
    
    // 检查是否已分配该角色
    const { data: existingAssignment } = await client
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role_id', role_id)
      .maybeSingle();
    
    if (existingAssignment) {
      return NextResponse.json(
        { error: '用户已拥有该角色' },
        { status: 400 }
      );
    }
    
    // 分配角色
    const { data: newAssignment, error: assignmentError } = await client
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: role_id,
      })
      .select()
      .single();
    
    if (assignmentError) {
      console.error('分配角色失败:', assignmentError);
      return NextResponse.json(
        { error: '分配角色失败' },
        { status: 500 }
      );
    }
    
    // 清除缓存
    clearPermissionCache();
    
    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error('分配用户角色失败:', error);
    return NextResponse.json(
      { error: '分配用户角色失败' },
      { status: 500 }
    );
  }
}

// 批量更新用户角色
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { role_ids } = body;
    
    if (!role_ids || !Array.isArray(role_ids)) {
      return NextResponse.json(
        { error: '角色ID列表不能为空' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 删除现有角色
    const { error: deleteError } = await client
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('删除现有角色失败:', deleteError);
      return NextResponse.json(
        { error: '更新用户角色失败' },
        { status: 500 }
      );
    }
    
    // 批量插入新角色
    if (role_ids.length > 0) {
      const inserts = role_ids.map((role_id: string) => ({
        user_id: userId,
        role_id: role_id,
      }));
      
      const { error: insertError } = await client
        .from('user_roles')
        .insert(inserts);
      
      if (insertError) {
        console.error('批量插入角色失败:', insertError);
        return NextResponse.json(
          { error: '更新用户角色失败' },
          { status: 500 }
        );
      }
    }
    
    // 清除缓存
    clearPermissionCache();
    
    // 获取更新后的角色列表
    const { data: updatedRoles } = await client
      .from('user_roles')
      .select(`
        id,
        user_id,
        created_at,
        roles (
          id,
          name,
          description,
          is_system
        )
      `)
      .eq('user_id', userId);
    
    const formattedRoles = updatedRoles?.map((ur: Record<string, unknown>) => ({
      id: ur.id,
      user_id: ur.user_id,
      created_at: ur.created_at,
      ...((Array.isArray(ur.roles) ? ur.roles[0] : ur.roles) as Record<string, unknown> || {}),
    })) || [];
    
    return NextResponse.json(formattedRoles);
  } catch (error) {
    console.error('更新用户角色失败:', error);
    return NextResponse.json(
      { error: '更新用户角色失败' },
      { status: 500 }
    );
  }
}

// 移除用户角色
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const roleId = searchParams.get('role_id');
    
    if (!roleId) {
      return NextResponse.json(
        { error: '角色ID不能为空' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 删除用户角色关联
    const { error: deleteError } = await client
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);
    
    if (deleteError) {
      console.error('删除用户角色失败:', deleteError);
      return NextResponse.json(
        { error: '删除用户角色失败' },
        { status: 500 }
      );
    }
    
    // 清除缓存
    clearPermissionCache();
    
    return NextResponse.json({ message: '角色移除成功' });
  } catch (error) {
    console.error('删除用户角色失败:', error);
    return NextResponse.json(
      { error: '删除用户角色失败' },
      { status: 500 }
    );
  }
}
