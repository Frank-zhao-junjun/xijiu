// 获取所有用户角色列表
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取所有用户及其角色
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    const client = getSupabaseClient();
    
    // 如果指定了用户ID，只获取该用户的角色
    if (userId) {
      const { data: userRoles, error } = await client
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
      
      if (error) {
        console.error('获取用户角色失败:', error);
        return NextResponse.json(
          { error: '获取用户角色失败' },
          { status: 500 }
        );
      }
      
      const formattedRoles = userRoles?.map((ur: Record<string, unknown>) => ({
        id: ur.id,
        user_id: ur.user_id,
        created_at: ur.created_at,
        ...((Array.isArray(ur.roles) ? ur.roles[0] : ur.roles) as Record<string, unknown> || {}),
      })) || [];
      
      return NextResponse.json(formattedRoles);
    }
    
    // 获取所有用户角色
    const { data: allUserRoles, error } = await client
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
      `);
    
    if (error) {
      console.error('获取用户角色列表失败:', error);
      return NextResponse.json(
        { error: '获取用户角色列表失败' },
        { status: 500 }
      );
    }
    
    // 按用户分组
    const usersMap = new Map<string, Record<string, unknown>>();
    
    allUserRoles?.forEach((ur: Record<string, unknown>) => {
      const userId = ur.user_id as string;
      const roleData = (Array.isArray(ur.roles) ? ur.roles[0] : ur.roles) as Record<string, unknown>;
      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          id: ur.id as string,
          user_id: userId,
          roles: [] as Record<string, unknown>[],
        });
      }
      (usersMap.get(userId)?.roles as Record<string, unknown>[])?.push(roleData);
    });
    
    const users = Array.from(usersMap.values());
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('获取用户角色列表失败:', error);
    return NextResponse.json(
      { error: '获取用户角色列表失败' },
      { status: 500 }
    );
  }
}
