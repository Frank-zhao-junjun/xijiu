// 权限检查装饰器 - 用于 API 路由
import { NextRequest, NextResponse } from 'next/server';
import { checkPermission, PermissionName } from '@/lib/permissions';

// 权限检查中间件包装器
export function withPermission(
  permission: PermissionName,
  handler: (request: NextRequest, context: { userId: string }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { userId: string }): Promise<NextResponse> => {
    // 检查权限
    const result = await checkPermission(context.userId, permission);
    
    if (!result.allowed) {
      return NextResponse.json(
        {
          error: '权限不足',
          message: result.reason,
        },
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // 执行原处理器
    return handler(request, context);
  };
}

// 多权限检查 - 需要满足所有权限
export function withAllPermissions(
  permissions: PermissionName[],
  handler: (request: NextRequest, context: { userId: string }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { userId: string }): Promise<NextResponse> => {
    for (const permission of permissions) {
      const result = await checkPermission(context.userId, permission);
      
      if (!result.allowed) {
        return NextResponse.json(
          {
            error: '权限不足',
            message: `缺少必要权限: ${permission}`,
          },
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    return handler(request, context);
  };
}

// 多权限检查 - 只需满足任一权限
export function withAnyPermission(
  permissions: PermissionName[],
  handler: (request: NextRequest, context: { userId: string }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { userId: string }): Promise<NextResponse> => {
    const { hasAnyPermission } = await import('@/lib/permissions');
    const hasPerm = await hasAnyPermission(context.userId, permissions);
    
    if (!hasPerm) {
      return NextResponse.json(
        {
          error: '权限不足',
          message: '缺少必要权限',
        },
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return handler(request, context);
  };
}

// 示例：如何在 API 路由中使用
/*
import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from './middleware';

// 示例 1：单权限检查
export async function GET(request: NextRequest) {
  const userId = getCurrentUserId(request); // 从请求中获取用户ID
  
  return withPermission('customers.view', async (req, ctx) => {
    // 你的业务逻辑
    const customers = await getCustomers();
    return NextResponse.json(customers);
  })(request, { userId });
}

// 示例 2：组合权限检查
export async function POST(request: NextRequest) {
  const userId = getCurrentUserId(request);
  
  return withAllPermissions(['customers.create', 'customers.edit'], async (req, ctx) => {
    // 你的业务逻辑
    const body = await request.json();
    const customer = await createCustomer(body);
    return NextResponse.json(customer, { status: 201 });
  })(request, { userId });
}
*/

// 获取当前用户ID的辅助函数
// 这个函数需要根据你的认证系统来实现
export function getCurrentUserId(request: NextRequest): string {
  // 从请求头、Cookie 或 JWT 中获取用户ID
  // 示例：从 Authorization header 获取
  const authHeader = request.headers.get('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // 在这里解析 token 并获取用户ID
    // 这里假设 token 就是用户ID（简化示例）
    return token;
  }
  
  // 默认返回演示用户ID
  return 'demo_user';
}
