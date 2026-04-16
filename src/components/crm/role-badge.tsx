'use client';

import { Badge } from '@/components/ui/badge';
import { Shield, Crown, User, Eye } from 'lucide-react';

/**
 * RoleBadge - 角色标签组件
 * 
 * 根据角色类型显示不同的标签样式
 * 
 * 使用方法：
 * <RoleBadge role="admin" />
 * <RoleBadge role="sales_manager" />
 * <RoleBadge role="sales_rep" />
 * <RoleBadge role="guest" />
 */

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

// 角色图标映射
const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Crown,
  sales_manager: Shield,
  sales_rep: User,
  guest: Eye,
};

// 角色显示名称映射
const roleLabels: Record<string, string> = {
  admin: '管理员',
  sales_manager: '销售经理',
  sales_rep: '销售人员',
  guest: '访客',
};

// 角色颜色映射
const roleColors: Record<string, string> = {
  admin: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  sales_manager: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  sales_rep: 'bg-green-500/10 text-green-600 border-green-500/20',
  guest: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export function RoleBadge({
  role,
  size = 'md',
  showIcon = true,
  variant = 'default',
}: RoleBadgeProps) {
  const Icon = roleIcons[role] || Shield;
  const label = roleLabels[role] || role;
  const colorClass = roleColors[role] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      className={`${colorClass} ${sizeClasses[size]} font-medium border`}
      variant={variant}
    >
      {showIcon && <Icon className={`${iconSizes[size]} mr-1`} />}
      {label}
    </Badge>
  );
}

/**
 * RoleBadgeGroup - 角色标签组组件
 * 
 * 显示用户的多个角色
 */

interface RoleBadgeGroupProps {
  roles: Array<{
    id: string;
    name: string;
    description?: string | null;
    is_system?: boolean;
  }>;
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
}

export function RoleBadgeGroup({
  roles,
  size = 'sm',
  maxDisplay = 3,
}: RoleBadgeGroupProps) {
  if (!roles || roles.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">未分配角色</span>
    );
  }

  const displayRoles = roles.slice(0, maxDisplay);
  const remainingCount = roles.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayRoles.map((role) => (
        <RoleBadge
          key={role.id}
          role={role.name}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className={`${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

/**
 * PermissionBadge - 权限标签组件
 * 
 * 显示单个权限
 */

interface PermissionBadgeProps {
  permission: string;
  size?: 'sm' | 'md';
}

// 权限中文映射
const permissionLabels: Record<string, string> = {
  'view': '查看',
  'create': '创建',
  'edit': '编辑',
  'delete': '删除',
  'export': '导出',
  'qualify': '认定',
  'close': '关闭',
  'sign': '签署',
  'send': '发送',
};

export function PermissionBadge({
  permission,
  size = 'sm',
}: PermissionBadgeProps) {
  const parts = permission.split('.');
  const action = parts[1] || permission;
  const label = permissionLabels[action] || action;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  return (
    <Badge
      variant="secondary"
      className={`${sizeClasses[size]} font-normal`}
    >
      {label}
    </Badge>
  );
}

/**
 * PermissionTag - 权限标签组件（简洁版）
 * 
 * 用于在权限列表中显示权限项
 */

interface PermissionTagProps {
  permission: string;
  label?: string;
  selected?: boolean;
  onClick?: () => void;
}

export function PermissionTag({
  permission,
  label,
  selected = false,
  onClick,
}: PermissionTagProps) {
  const parts = permission.split('.');
  const moduleKey = parts[0];
  const action = parts[1] || permission;
  
  // 模块中文映射
  const moduleLabels: Record<string, string> = {
    customers: '客户',
    leads: '线索',
    opportunities: '商机',
    contracts: '合同',
    invoices: '发票',
    orders: '订单',
    quotes: '报价',
    reports: '报表',
    settings: '设置',
    users: '用户',
  };

  const displayLabel = label || `${moduleLabels[moduleKey] || moduleKey} - ${permissionLabels[action] || action}`;

  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center px-2 py-1 rounded text-xs font-medium
        transition-colors cursor-pointer
        ${selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }
      `}
    >
      {displayLabel}
    </span>
  );
}

export default RoleBadge;
