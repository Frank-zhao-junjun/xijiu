// 角色管理 API 路由
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getAllRoles, getRoleWithPermissions, clearPermissionCache } from '@/lib/permissions';
import type { Role } from '@/storage/database/shared/schema';

// 获取所有角色
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roleId = searchParams.get('id');
    
    // 获取单个角色详情
    if (roleId) {
      const role = await getRoleWithPermissions(roleId);
      
      if (!role) {
        return NextResponse.json(
          { error: '角色不存在' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(role);
    }
    
    // 获取所有角色列表
    const roles = await getAllRoles();
    
    // 为每个角色添加权限信息
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const roleDetail = await getRoleWithPermissions(role.id);
        return roleDetail || role;
      })
    );
    
    return NextResponse.json(rolesWithPermissions);
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return NextResponse.json(
      { error: '获取角色列表失败' },
      { status: 500 }
    );
  }
}

// 创建新角色
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, permissions } = body;
    
    // 验证必填字段
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: '角色名称不能为空' },
        { status: 400 }
      );
    }
    
    // 验证角色名格式
    const nameRegex = /^[a-z][a-z0-9_]*$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json(
        { error: '角色名称只能包含小写字母、数字和下划线，且必须以字母开头' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 检查角色名是否已存在
    const { data: existingRole } = await client
      .from('roles')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    
    if (existingRole) {
      return NextResponse.json(
        { error: '角色名已存在' },
        { status: 400 }
      );
    }
    
    // 创建角色
    const { data: newRole, error: roleError } = await client
      .from('roles')
      .insert({
        name,
        description: description || null,
        is_system: false,
      })
      .select()
      .single();
    
    if (roleError) {
      console.error('创建角色失败:', roleError);
      return NextResponse.json(
        { error: '创建角色失败' },
        { status: 500 }
      );
    }
    
    // 如果提供了权限，则分配权限
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      // 获取权限 ID
      const { data: perms } = await client
        .from('permissions')
        .select('id, name')
        .in('name', permissions);
      
      const permIdMap = new Map<string, string>();
      perms?.forEach((p: Record<string, unknown>) => {
        permIdMap.set(p.name as string, p.id as string);
      });
      
      // 插入角色权限关联
      const rolePermInserts = permissions
        .filter((p: string) => permIdMap.has(p))
        .map((p: string) => ({
          role_id: newRole.id,
          permission_id: permIdMap.get(p),
        }));
      
      if (rolePermInserts.length > 0) {
        const { error: permError } = await client
          .from('role_permissions')
          .insert(rolePermInserts);
        
        if (permError) {
          console.error('分配权限失败:', permError);
        }
      }
    }
    
    // 清除缓存
    clearPermissionCache();
    
    // 返回创建的角色详情
    const roleDetail = await getRoleWithPermissions(newRole.id);
    
    return NextResponse.json(roleDetail, { status: 201 });
  } catch (error) {
    console.error('创建角色失败:', error);
    return NextResponse.json(
      { error: '创建角色失败' },
      { status: 500 }
    );
  }
}

// 更新角色
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, permissions } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: '角色ID不能为空' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 检查角色是否存在
    const { data: existingRole } = await client
      .from('roles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (!existingRole) {
      return NextResponse.json(
        { error: '角色不存在' },
        { status: 404 }
      );
    }
    
    // 检查是否为系统角色
    if (existingRole.is_system) {
      return NextResponse.json(
        { error: '系统角色不能修改' },
        { status: 403 }
      );
    }
    
    // 更新角色基本信息
    const updates: Partial<Role> = {};
    if (name && name !== existingRole.name) {
      // 检查新名称是否已存在
      const { data: nameExists } = await client
        .from('roles')
        .select('id')
        .eq('name', name)
        .neq('id', id)
        .maybeSingle();
      
      if (nameExists) {
        return NextResponse.json(
          { error: '角色名已存在' },
          { status: 400 }
        );
      }
      updates.name = name;
    }
    if (description !== undefined) {
      updates.description = description;
    }
    updates.updated_at = new Date().toISOString() as unknown as Date;
    
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await client
        .from('roles')
        .update(updates)
        .eq('id', id);
      
      if (updateError) {
        console.error('更新角色失败:', updateError);
        return NextResponse.json(
          { error: '更新角色失败' },
          { status: 500 }
        );
      }
    }
    
    // 更新权限（如果提供了）
    if (permissions && Array.isArray(permissions)) {
      // 删除现有权限
      const { error: deleteError } = await client
        .from('role_permissions')
        .delete()
        .eq('role_id', id);
      
      if (deleteError) {
        console.error('删除现有权限失败:', deleteError);
      }
      
      // 添加新权限
      if (permissions.length > 0) {
        // 获取权限 ID
        const { data: perms } = await client
          .from('permissions')
          .select('id, name')
          .in('name', permissions);
        
        const permIdMap = new Map<string, string>();
        perms?.forEach((p: Record<string, unknown>) => {
          permIdMap.set(p.name as string, p.id as string);
        });
        
        const rolePermInserts = permissions
          .filter((p: string) => permIdMap.has(p))
          .map((p: string) => ({
            role_id: id,
            permission_id: permIdMap.get(p),
          }));
        
        if (rolePermInserts.length > 0) {
          const { error: permError } = await client
            .from('role_permissions')
            .insert(rolePermInserts);
          
          if (permError) {
            console.error('更新权限失败:', permError);
          }
        }
      }
    }
    
    // 清除缓存
    clearPermissionCache();
    
    // 返回更新后的角色详情
    const roleDetail = await getRoleWithPermissions(id);
    
    return NextResponse.json(roleDetail);
  } catch (error) {
    console.error('更新角色失败:', error);
    return NextResponse.json(
      { error: '更新角色失败' },
      { status: 500 }
    );
  }
}

// 删除角色
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '角色ID不能为空' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 检查角色是否存在
    const { data: existingRole } = await client
      .from('roles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (!existingRole) {
      return NextResponse.json(
        { error: '角色不存在' },
        { status: 404 }
      );
    }
    
    // 检查是否为系统角色
    if (existingRole.is_system) {
      return NextResponse.json(
        { error: '系统角色不能删除' },
        { status: 403 }
      );
    }
    
    // 删除角色（关联的角色权限会被级联删除）
    const { error: deleteError } = await client
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('删除角色失败:', deleteError);
      return NextResponse.json(
        { error: '删除角色失败' },
        { status: 500 }
      );
    }
    
    // 清除缓存
    clearPermissionCache();
    
    return NextResponse.json({ message: '角色删除成功' });
  } catch (error) {
    console.error('删除角色失败:', error);
    return NextResponse.json(
      { error: '删除角色失败' },
      { status: 500 }
    );
  }
}
