'use client';

import { useEffect, useState, useCallback } from 'react';
import type {
  ElementType,
  ReactNode,
  HTMLAttributes,
  ButtonHTMLAttributes,
  ComponentProps,
} from 'react';
import { getUserPermissions, PermissionName } from '@/lib/permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

/**
 * PermissionGuard - 权限守卫组件
 * 
 * 用于在 UI 中根据用户权限显示/隐藏内容
 * 
 * 使用方法：
 * 
 * // 基本用法 - 根据权限显示/隐藏按钮
 * <PermissionGuard permission="customers.create">
 *   <Button>创建客户</Button>
 * </PermissionGuard>
 * 
 * // 显示替代内容
 * <PermissionGuard 
 *   permission="customers.delete" 
 *   fallback={<span>您没有删除权限</span>}
 * >
 *   <Button>删除</Button>
 * </PermissionGuard>
 * 
 * // 多个权限（需要全部满足）
 * <PermissionGuard permissions={['customers.edit', 'customers.delete']}>
 *   <Button>批量操作</Button>
 * </PermissionGuard>
 * 
 * // 多个权限（只需满足任一）
 * <PermissionGuard 
 *   permissions={['customers.edit', 'admin']}
 *   mode="any"
 * >
 *   <Button>编辑</Button>
 * </PermissionGuard>
 */

interface PermissionGuardProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  permission?: PermissionName;
  permissions?: PermissionName[];
  mode?: 'all' | 'any';
  userId?: string;
  showOnLoading?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
  as?: ElementType;
}

// PermissionGuard 组件
export function PermissionGuard({
  permission,
  permissions = [],
  mode = 'all',
  userId,
  showOnLoading = false,
  fallback = null,
  children,
  as: Wrapper = 'div',
  ...props
}: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkPermissions = useCallback(async () => {
    try {
      // 使用提供的 userId 或默认用户
      const currentUserId = userId || 'demo_user';
      
      // 如果没有指定权限，默认允许访问
      if (!permission && (!permissions || permissions.length === 0)) {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      // 获取用户的所有权限
      const userPermissions = await getUserPermissions(currentUserId);
      
      // 检查权限
      let result = false;
      
      if (permission) {
        // 单个权限检查
        result = userPermissions.has(permission);
      } else if (permissions && permissions.length > 0) {
        // 多个权限检查
        if (mode === 'all') {
          result = permissions.every(p => userPermissions.has(p));
        } else {
          result = permissions.some(p => userPermissions.has(p));
        }
      }
      
      setHasPermission(result);
    } catch (error) {
      console.error('权限检查失败:', error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  }, [permission, permissions, mode, userId]);

  useEffect(() => {
    void checkPermissions();
  }, [checkPermissions]);

  // 加载中状态
  if (loading) {
    if (showOnLoading) {
      return <>{children}</>;
    }
    return (
      <Wrapper {...props}>
        <Skeleton className="h-10 w-20" />
      </Wrapper>
    );
  }

  if (hasPermission) {
    return <Wrapper {...props}>{children}</Wrapper>;
  }

  // 无权限，显示替代内容
  return <>{fallback}</>;
}

/**
 * PermissionButton - 权限按钮组件
 * 
 * 根据权限自动启用/禁用按钮
 * 
 * 使用方法：
 * <PermissionButton permission="customers.create" onClick={handleCreate}>
 *   创建客户
 * </PermissionButton>
 */

interface PermissionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  permission: PermissionName;
  userId?: string;
  // 权限不足时显示的提示
  disabledTooltip?: string;
}

/**
 * PermissionLink - 权限链接组件
 * 
 * 根据权限自动启用/禁用链接
 */

interface PermissionLinkProps extends Omit<ComponentProps<typeof Link>, 'children'> {
  permission: PermissionName;
  userId?: string;
  children: ReactNode;
}

/**
 * PermissionPage - 权限页面组件
 * 
 * 用于保护整个页面的访问
 * 
 * 使用方法：
 * <PermissionPage permission="customers.view">
 *   <CustomerList />
 * </PermissionPage>
 */

interface PermissionPageProps {
  permission: PermissionName;
  userId?: string;
  children: ReactNode;
  // 权限不足时显示的内容
  unauthorizedContent?: ReactNode;
}

/**
 * PermissionBadge - 权限标签组件
 * 
 * 显示用户拥有的权限
 */

interface PermissionBadgeProps {
  permission: PermissionName;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function PermissionButton({
  permission,
  userId,
  disabledTooltip,
  children,
  ...props
}: PermissionButtonProps) {
  return (
    <PermissionGuard
      permission={permission}
      userId={userId}
      fallback={
        <Button type="button" disabled title={disabledTooltip} {...props}>
          {children}
        </Button>
      }
    >
      <Button type="button" {...props}>
        {children}
      </Button>
    </PermissionGuard>
  );
}

export function PermissionLink({
  permission,
  userId,
  children,
  ...props
}: PermissionLinkProps) {
  return (
    <PermissionGuard permission={permission} userId={userId} fallback={<span className="text-muted-foreground text-sm">无权限</span>}>
      <Link {...props}>{children}</Link>
    </PermissionGuard>
  );
}

export function PermissionPage({
  permission,
  userId,
  children,
  unauthorizedContent = <div className="p-6 text-center text-muted-foreground">无权访问此页面</div>,
}: PermissionPageProps) {
  return (
    <PermissionGuard permission={permission} userId={userId} fallback={unauthorizedContent}>
      {children}
    </PermissionGuard>
  );
}

export function PermissionBadge({ permission, variant = 'secondary', size: _size = 'sm' }: PermissionBadgeProps) {
  return (
    <PermissionGuard permission={permission} fallback={null}>
      <Badge variant={variant}>{String(permission)}</Badge>
    </PermissionGuard>
  );
}

export const PermissionComponents = {
  Guard: PermissionGuard,
  Button: PermissionButton,
  Link: PermissionLink,
  Page: PermissionPage,
  Badge: PermissionBadge,
};

export default PermissionGuard;
