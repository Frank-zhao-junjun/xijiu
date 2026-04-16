// 权限检查辅助函数 - 在 API 路由中使用
import { NextRequest, NextResponse } from 'next/server';
import { hasPermission, PermissionName } from '@/lib/permissions';

/**
 * API 权限检查工具
 * 
 * 使用方法：
 * 
 * // 方式 1：使用检查函数
 * const hasAccess = await checkApiPermission(request, 'customers.edit');
 * if (!hasAccess) {
 *   return NextResponse.json({ error: '权限不足' }, { status: 403 });
 * }
 * 
 * // 方式 2：使用守卫函数
 * return withPermissionGuard(request, 'settings.roles', async () => {
 *   // 你的业务逻辑
 *   return NextResponse.json({ success: true });
 * });
 */

// 从请求中获取用户ID
// 这个函数需要根据你的认证系统来实现
export function getUserIdFromRequest(request: NextRequest): string | null {
  // 方式 1：从 Authorization header 获取
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // 在这里解析 token 并获取用户ID
    // 这里假设 token 就是用户ID（简化示例）
    return token;
  }
  
  // 方式 2：从 Cookie 获取
  const cookies = request.cookies;
  const userIdCookie = cookies.get('user_id');
  if (userIdCookie) {
    return userIdCookie.value;
  }
  
  // 方式 3：从 URL 参数获取（仅用于演示）
  const searchParams = request.nextUrl.searchParams;
  const userIdParam = searchParams.get('user_id');
  if (userIdParam) {
    return userIdParam;
  }
  
  return null;
}

// 检查 API 权限
export async function checkApiPermission(
  request: NextRequest,
  permission: PermissionName
): Promise<{ allowed: boolean; userId: string | null; reason?: string }> {
  const userId = getUserIdFromRequest(request);
  
  // 如果无法获取用户ID，返回未授权
  if (!userId) {
    return {
      allowed: false,
      userId: null,
      reason: '无法识别用户身份',
    };
  }
  
  // 检查权限
  const hasPerm = await hasPermission(userId, permission);
  
  if (!hasPerm) {
    return {
      allowed: false,
      userId,
      reason: `缺少必要权限: ${permission}`,
    };
  }
  
  return {
    allowed: true,
    userId,
  };
}

// 权限检查守卫 - 包装处理函数
export async function withPermissionGuard(
  request: NextRequest,
  permission: PermissionName,
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const { allowed, userId, reason } = await checkApiPermission(request, permission);
  
  if (!allowed) {
    return NextResponse.json(
      {
        error: '权限不足',
        message: reason,
      },
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  return handler(userId!);
}

// 多权限检查守卫 - 需要满足所有权限
export async function withAllPermissionsGuard(
  request: NextRequest,
  permissions: PermissionName[],
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const { allowed, userId, reason } = await checkApiPermission(request, permissions[0]);
  
  if (!allowed) {
    return NextResponse.json(
      {
        error: '权限不足',
        message: reason,
      },
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // 检查其他权限
  for (let i = 1; i < permissions.length; i++) {
    const hasPerm = await hasPermission(userId!, permissions[i]);
    if (!hasPerm) {
      return NextResponse.json(
        {
          error: '权限不足',
          message: `缺少必要权限: ${permissions[i]}`,
        },
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
  
  return handler(userId!);
}

// 示例：在 CRM API 路由中使用权限检查
/*
import { NextRequest, NextResponse } from 'next/server';
import { withPermissionGuard } from '@/lib/api-permission';

// GET 请求 - 需要 view 权限
export async function GET(request: NextRequest) {
  return withPermissionGuard(request, 'customers.view', async (userId) => {
    // 你的业务逻辑
    const customers = await db.getAllCustomers();
    return NextResponse.json(customers);
  });
}

// POST 请求 - 需要 create 权限
export async function POST(request: NextRequest) {
  return withPermissionGuard(request, 'customers.create', async (userId) => {
    const body = await request.json();
    const customer = await db.createCustomer(body);
    return NextResponse.json(customer, { status: 201 });
  });
}

// PUT 请求 - 需要 edit 权限
export async function PUT(request: NextRequest) {
  return withPermissionGuard(request, 'customers.edit', async (userId) => {
    const body = await request.json();
    const { id, ...updates } = body;
    const customer = await db.updateCustomer(id, updates);
    return NextResponse.json(customer);
  });
}

// DELETE 请求 - 需要 delete 权限
export async function DELETE(request: NextRequest) {
  return withPermissionGuard(request, 'customers.delete', async (userId) => {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    await db.deleteCustomer(id);
    return NextResponse.json({ success: true });
  });
}
*/

// 权限检查的 HTTP 状态码映射
export const PermissionErrorMessages: Record<string, string> = {
  'customers.view': '您没有查看客户的权限',
  'customers.create': '您没有创建客户的权限',
  'customers.edit': '您没有编辑客户的权限',
  'customers.delete': '您没有删除客户的权限',
  'leads.view': '您没有查看线索的权限',
  'leads.create': '您没有创建线索的权限',
  'leads.edit': '您没有编辑线索的权限',
  'leads.delete': '您没有删除线索的权限',
  'opportunities.view': '您没有查看商机的权限',
  'opportunities.create': '您没有创建商机的权限',
  'opportunities.edit': '您没有编辑商机的权限',
  'opportunities.delete': '您没有删除商机的权限',
  'contracts.view': '您没有查看合同的权限',
  'contracts.create': '您没有创建合同的权限',
  'contracts.edit': '您没有编辑合同的权限',
  'contracts.delete': '您没有删除合同的权限',
  'settings.roles': '您没有管理角色的权限',
  'settings.edit': '您没有编辑设置的权限',
  'users.edit': '您没有编辑用户的权限',
  'users.delete': '您没有删除用户的权限',
};

// 获取权限错误消息
export function getPermissionErrorMessage(permission: string): string {
  return PermissionErrorMessages[permission] || `缺少必要权限: ${permission}`;
}
