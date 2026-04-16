// 权限检查核心函数 - RBAC (Role-Based Access Control)
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ============ 权限定义 ============

// 权限标识符
export type PermissionName = 
  | 'customers.view' | 'customers.create' | 'customers.edit' | 'customers.delete' | 'customers.export'
  | 'leads.view' | 'leads.create' | 'leads.edit' | 'leads.delete' | 'leads.qualify'
  | 'opportunities.view' | 'opportunities.create' | 'opportunities.edit' | 'opportunities.delete' | 'opportunities.close' | 'opportunities.export'
  | 'contracts.view' | 'contracts.create' | 'contracts.edit' | 'contracts.delete' | 'contracts.sign'
  | 'invoices.view' | 'invoices.create' | 'invoices.edit' | 'invoices.delete' | 'invoices.send'
  | 'orders.view' | 'orders.create' | 'orders.edit' | 'orders.delete'
  | 'quotes.view' | 'quotes.create' | 'quotes.edit' | 'quotes.delete' | 'quotes.send'
  | 'reports.view' | 'reports.export' | 'reports.team'
  | 'settings.view' | 'settings.edit' | 'settings.fields' | 'settings.workflows' | 'settings.roles'
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete';

// 权限分类
export type PermissionCategory = 
  | 'customers' | 'leads' | 'opportunities' | 'contracts' 
  | 'invoices' | 'orders' | 'quotes' | 'reports' 
  | 'settings' | 'users';

// 角色标识符
export type RoleName = 'admin' | 'sales_manager' | 'sales_rep' | 'guest';

// ============ 权限数据初始化 ============

// 默认权限定义
export const defaultPermissions: Array<{
  name: string;
  label: string;
  description: string;
  category: string;
}> = [
  // 客户权限
  { name: 'customers.view', label: '查看客户', description: '查看客户列表和详情', category: 'customers' },
  { name: 'customers.create', label: '创建客户', description: '创建新客户', category: 'customers' },
  { name: 'customers.edit', label: '编辑客户', description: '编辑客户信息', category: 'customers' },
  { name: 'customers.delete', label: '删除客户', description: '删除客户', category: 'customers' },
  { name: 'customers.export', label: '导出客户', description: '导出客户数据', category: 'customers' },
  
  // 线索权限
  { name: 'leads.view', label: '查看线索', description: '查看线索列表和详情', category: 'leads' },
  { name: 'leads.create', label: '创建线索', description: '创建新线索', category: 'leads' },
  { name: 'leads.edit', label: '编辑线索', description: '编辑线索信息', category: 'leads' },
  { name: 'leads.delete', label: '删除线索', description: '删除线索', category: 'leads' },
  { name: 'leads.qualify', label: '认定线索', description: '认定线索资质', category: 'leads' },
  
  // 商机权限
  { name: 'opportunities.view', label: '查看商机', description: '查看商机列表和详情', category: 'opportunities' },
  { name: 'opportunities.create', label: '创建商机', description: '创建新商机', category: 'opportunities' },
  { name: 'opportunities.edit', label: '编辑商机', description: '编辑商机信息', category: 'opportunities' },
  { name: 'opportunities.delete', label: '删除商机', description: '删除商机', category: 'opportunities' },
  { name: 'opportunities.close', label: '关闭商机', description: '关闭商机（成交或失败）', category: 'opportunities' },
  { name: 'opportunities.export', label: '导出商机', description: '导出商机数据', category: 'opportunities' },
  
  // 合同权限
  { name: 'contracts.view', label: '查看合同', description: '查看合同列表和详情', category: 'contracts' },
  { name: 'contracts.create', label: '创建合同', description: '创建新合同', category: 'contracts' },
  { name: 'contracts.edit', label: '编辑合同', description: '编辑合同信息', category: 'contracts' },
  { name: 'contracts.delete', label: '删除合同', description: '删除合同', category: 'contracts' },
  { name: 'contracts.sign', label: '签署合同', description: '签署合同', category: 'contracts' },
  
  // 发票权限
  { name: 'invoices.view', label: '查看发票', description: '查看发票列表和详情', category: 'invoices' },
  { name: 'invoices.create', label: '创建发票', description: '创建新发票', category: 'invoices' },
  { name: 'invoices.edit', label: '编辑发票', description: '编辑发票信息', category: 'invoices' },
  { name: 'invoices.delete', label: '删除发票', description: '删除发票', category: 'invoices' },
  { name: 'invoices.send', label: '发送发票', description: '发送发票给客户', category: 'invoices' },
  
  // 订单权限
  { name: 'orders.view', label: '查看订单', description: '查看订单列表和详情', category: 'orders' },
  { name: 'orders.create', label: '创建订单', description: '创建新订单', category: 'orders' },
  { name: 'orders.edit', label: '编辑订单', description: '编辑订单信息', category: 'orders' },
  { name: 'orders.delete', label: '删除订单', description: '删除订单', category: 'orders' },
  
  // 报价权限
  { name: 'quotes.view', label: '查看报价', description: '查看报价列表和详情', category: 'quotes' },
  { name: 'quotes.create', label: '创建报价', description: '创建新报价', category: 'quotes' },
  { name: 'quotes.edit', label: '编辑报价', description: '编辑报价信息', category: 'quotes' },
  { name: 'quotes.delete', label: '删除报价', description: '删除报价', category: 'quotes' },
  { name: 'quotes.send', label: '发送报价', description: '发送报价给客户', category: 'quotes' },
  
  // 报表权限
  { name: 'reports.view', label: '查看报表', description: '查看各种报表', category: 'reports' },
  { name: 'reports.export', label: '导出报表', description: '导出报表数据', category: 'reports' },
  { name: 'reports.team', label: '团队报表', description: '查看团队报表', category: 'reports' },
  
  // 系统设置权限
  { name: 'settings.view', label: '查看设置', description: '查看系统设置', category: 'settings' },
  { name: 'settings.edit', label: '编辑设置', description: '编辑系统设置', category: 'settings' },
  { name: 'settings.fields', label: '自定义字段', description: '管理自定义字段', category: 'settings' },
  { name: 'settings.workflows', label: '工作流设置', description: '管理工作流', category: 'settings' },
  { name: 'settings.roles', label: '角色管理', description: '管理角色和权限', category: 'settings' },
  
  // 用户管理权限
  { name: 'users.view', label: '查看用户', description: '查看用户列表', category: 'users' },
  { name: 'users.create', label: '创建用户', description: '创建新用户', category: 'users' },
  { name: 'users.edit', label: '编辑用户', description: '编辑用户信息', category: 'users' },
  { name: 'users.delete', label: '删除用户', description: '删除用户', category: 'users' },
];

// 默认角色定义
export const defaultRoles: Array<{
  name: string;
  description: string;
  is_system: boolean;
  permissions: string[];
}> = [
  {
    name: 'admin',
    description: '系统管理员，拥有所有权限',
    is_system: true,
    permissions: defaultPermissions.map(p => p.name),
  },
  {
    name: 'sales_manager',
    description: '销售经理，管理团队和销售流程',
    is_system: true,
    permissions: [
      ...defaultPermissions.filter(p => ['customers', 'leads', 'opportunities', 'contracts', 'invoices', 'orders', 'quotes'].includes(p.category)).map(p => p.name),
      'reports.view', 'reports.export', 'reports.team',
      'settings.view', 'settings.fields', 'settings.workflows',
      'users.view',
    ],
  },
  {
    name: 'sales_rep',
    description: '销售人员，负责客户跟进',
    is_system: true,
    permissions: [
      'customers.view', 'customers.create', 'customers.edit',
      'leads.view', 'leads.create', 'leads.edit', 'leads.qualify',
      'opportunities.view', 'opportunities.create', 'opportunities.edit',
      'contracts.view', 'contracts.create', 'contracts.sign',
      'invoices.view',
      'orders.view', 'orders.create',
      'quotes.view', 'quotes.create', 'quotes.edit', 'quotes.send',
      'reports.view',
    ],
  },
  {
    name: 'guest',
    description: '访客，只有查看权限',
    is_system: true,
    permissions: [
      'customers.view', 'leads.view', 'opportunities.view',
      'contracts.view', 'invoices.view', 'orders.view', 'quotes.view',
    ],
  },
];

// ============ 缓存机制 ============

interface PermissionCache {
  userPermissions: Map<string, Set<string>>;
  rolePermissions: Map<string, Set<string>>;
  lastUpdate: number;
}

const permissionCache: PermissionCache = {
  userPermissions: new Map(),
  rolePermissions: new Map(),
  lastUpdate: Date.now(),
};

const CACHE_TTL = 5 * 60 * 1000; // 缓存有效期：5分钟

// 清除缓存
export function clearPermissionCache(): void {
  permissionCache.userPermissions.clear();
  permissionCache.rolePermissions.clear();
  permissionCache.lastUpdate = Date.now();
}

// ============ 权限操作函数 ============

// 获取用户的所有权限
export async function getUserPermissions(userId: string): Promise<Set<string>> {
  // 检查缓存
  const now = Date.now();
  if (now - permissionCache.lastUpdate < CACHE_TTL) {
    const cached = permissionCache.userPermissions.get(userId);
    if (cached) return cached;
  }
  
  const client = getSupabaseClient();
  
  // 查询用户的角色
  const { data: userRoles, error: userRolesError } = await client
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId);
  
  if (userRolesError) {
    console.error('获取用户角色失败:', userRolesError);
    return new Set();
  }
  
  if (!userRoles || userRoles.length === 0) {
    // 如果用户没有角色，返回空集合
    return new Set();
  }
  
  const roleIds = userRoles.map((ur: { role_id: string }) => ur.role_id);
  
  // 查询角色的权限
  const { data: rolePermissions, error: rolePermissionsError } = await client
    .from('role_permissions')
    .select('permission_id')
    .in('role_id', roleIds);
  
  if (rolePermissionsError) {
    console.error('获取角色权限失败:', rolePermissionsError);
    return new Set();
  }
  
  // 获取权限名称
  const permissionIds = rolePermissions.map((rp: { permission_id: string }) => rp.permission_id);
  
  if (permissionIds.length === 0) {
    return new Set();
  }
  
  const { data: permissions, error: permissionsError } = await client
    .from('permissions')
    .select('name')
    .in('id', permissionIds);
  
  if (permissionsError) {
    console.error('获取权限详情失败:', permissionsError);
    return new Set();
  }
  
  const permissionNames = new Set(permissions?.map((p: { name: string }) => p.name) || []);
  
  // 更新缓存
  permissionCache.userPermissions.set(userId, permissionNames);
  permissionCache.lastUpdate = now;
  
  return permissionNames;
}

// 检查用户是否拥有指定权限
export async function hasPermission(userId: string, permission: PermissionName): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return userPermissions.has(permission);
}

// 检查用户是否拥有所有指定权限
export async function hasAllPermissions(userId: string, permissions: PermissionName[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.every(p => userPermissions.has(p));
}

// 检查用户是否拥有任一指定权限
export async function hasAnyPermission(userId: string, permissions: PermissionName[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.some(p => userPermissions.has(p));
}

// 获取用户在某个模块的所有权限
export async function getModulePermissions(userId: string, module: PermissionCategory): Promise<string[]> {
  const userPermissions = await getUserPermissions(userId);
  const modulePermissions = Array.from(userPermissions).filter(p => p.startsWith(`${module}.`));
  return modulePermissions;
}

// ============ 角色操作函数 ============

// 获取所有角色
export async function getAllRoles(): Promise<Array<{
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}>> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('roles')
    .select('*')
    .order('is_system', { ascending: false })
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('获取角色列表失败:', error);
    return [];
  }
  
  return data || [];
}

// 获取角色详情（包含权限）
export async function getRoleWithPermissions(roleId: string): Promise<{
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
} | null> {
  const client = getSupabaseClient();
  
  // 获取角色信息
  const { data: role, error: roleError } = await client
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .maybeSingle();
  
  if (roleError || !role) {
    console.error('获取角色详情失败:', roleError);
    return null;
  }
  
  // 获取角色权限
  const { data: rolePerms, error: rolePermsError } = await client
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', roleId);
  
  if (rolePermsError) {
    console.error('获取角色权限失败:', rolePermsError);
    return null;
  }
  
  const permissionIds = rolePerms?.map((rp: { permission_id: string }) => rp.permission_id) || [];
  
  // 获取权限名称
  let permissions: string[] = [];
  if (permissionIds.length > 0) {
    const { data: perms, error: permsError } = await client
      .from('permissions')
      .select('name')
      .in('id', permissionIds);
    
    if (!permsError && perms) {
      permissions = perms.map((p: { name: string }) => p.name);
    }
  }
  
  return {
    ...role,
    permissions,
  };
}

// ============ 权限检查中间件 ============

export interface PermissionContext {
  userId: string;
  userName?: string;
}

// 权限检查结果
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

// 检查用户权限（用于 API 中间件）
export async function checkPermission(
  userId: string,
  requiredPermission: PermissionName
): Promise<PermissionCheckResult> {
  try {
    const hasPerm = await hasPermission(userId, requiredPermission);
    
    if (!hasPerm) {
      return {
        allowed: false,
        reason: `缺少必要权限: ${requiredPermission}`,
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('权限检查失败:', error);
    return {
      allowed: false,
      reason: '权限检查失败',
    };
  }
}

// 权限检查包装器（用于 API 路由）
export function withPermission(
  permission: PermissionName,
  handler: (context: PermissionContext) => Promise<Response>
) {
  return async (context: PermissionContext): Promise<Response> => {
    const result = await checkPermission(context.userId, permission);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: '权限不足',
          message: result.reason,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return handler(context);
  };
}

// ============ 工具函数 ============

// 格式化权限列表（按模块分组）
export function groupPermissionsByCategory(permissions: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  permissions.forEach(permission => {
    const [category] = permission.split('.');
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(permission);
  });
  
  return grouped;
}

// 获取权限的中文标签
export function getPermissionLabel(permissionName: string): string {
  const permission = defaultPermissions.find(p => p.name === permissionName);
  return permission?.label || permissionName;
}

// 获取权限分类的中文标签
export function getCategoryLabel(category: string): string {
  const categoryLabels: Record<string, string> = {
    customers: '客户管理',
    leads: '线索管理',
    opportunities: '商机管理',
    contracts: '合同管理',
    invoices: '发票管理',
    orders: '订单管理',
    quotes: '报价管理',
    reports: '报表管理',
    settings: '系统设置',
    users: '用户管理',
  };
  
  return categoryLabels[category] || category;
}

// 初始化默认权限和角色
export async function initializeDefaultPermissions(): Promise<void> {
  const client = getSupabaseClient();
  
  // 检查是否已经初始化
  const { data: existingRoles } = await client
    .from('roles')
    .select('id')
    .eq('name', 'admin')
    .maybeSingle();
  
  if (existingRoles) {
    console.log('权限数据已初始化，跳过');
    return;
  }
  
  console.log('开始初始化权限数据...');
  
  // 插入默认权限
  for (const permission of defaultPermissions) {
    const { error } = await client
      .from('permissions')
      .upsert({
        name: permission.name,
        label: permission.label,
        description: permission.description,
        category: permission.category,
      }, {
        onConflict: 'name',
      });
    
    if (error) {
      console.error(`插入权限失败 ${permission.name}:`, error);
    }
  }
  
  // 获取权限 ID 映射
  const { data: allPermissions } = await client
    .from('permissions')
    .select('id, name');
  
  const permissionIdMap = new Map<string, string>();
  allPermissions?.forEach((p: { id: string; name: string }) => {
    permissionIdMap.set(p.name, p.id);
  });
  
  // 插入默认角色
  for (const role of defaultRoles) {
    const { data: roleData, error: roleError } = await client
      .from('roles')
      .upsert({
        name: role.name,
        description: role.description,
        is_system: role.is_system,
      }, {
        onConflict: 'name',
      })
      .select()
      .single();
    
    if (roleError || !roleData) {
      console.error(`插入角色失败 ${role.name}:`, roleError);
      continue;
    }
    
    const roleId = roleData.id;
    
    // 插入角色权限关联
    for (const permName of role.permissions) {
      const permId = permissionIdMap.get(permName);
      if (!permId) continue;
      
      const { error } = await client
        .from('role_permissions')
        .upsert({
          role_id: roleId,
          permission_id: permId,
        }, {
          onConflict: 'role_permission_unique',
        });
      
      if (error) {
        console.error(`插入角色权限关联失败 ${role.name} - ${permName}:`, error);
      }
    }
  }
  
  console.log('权限数据初始化完成');
  clearPermissionCache();
}
