'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, Plus, Trash2, Edit, ChevronDown, ChevronRight 
} from 'lucide-react';
import { defaultPermissions, getCategoryLabel } from '@/lib/permissions';

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
  created_at: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['customers']));
  const [loading, setLoading] = useState(true);
  
  // 新建角色表单
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });
  
  // 编辑角色表单
  const [editRole, setEditRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('获取角色列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
      });
      
      if (response.ok) {
        await fetchRoles();
        setIsCreateOpen(false);
        setNewRole({ name: '', description: '', permissions: [] });
      } else {
        const error = await response.json();
        alert(error.error || '创建失败');
      }
    } catch (error) {
      console.error('创建角色失败:', error);
      alert('创建失败');
    }
  };

  const handleEditRole = async () => {
    if (!selectedRole) return;
    
    try {
      const response = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRole.id,
          ...editRole,
        }),
      });
      
      if (response.ok) {
        await fetchRoles();
        setIsEditOpen(false);
        setSelectedRole(null);
      } else {
        const error = await response.json();
        alert(error.error || '更新失败');
      }
    } catch (error) {
      console.error('更新角色失败:', error);
      alert('更新失败');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('确定要删除这个角色吗？')) return;
    
    try {
      const response = await fetch(`/api/roles?id=${roleId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchRoles();
      } else {
        const error = await response.json();
        alert(error.error || '删除失败');
      }
    } catch (error) {
      console.error('删除角色失败:', error);
      alert('删除失败');
    }
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setEditRole({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
    });
    setIsEditOpen(true);
  };

  const togglePermission = (
    permission: string,
    currentPermissions: string[],
    setter: (value: string[]) => void
  ) => {
    if (currentPermissions.includes(permission)) {
      setter(currentPermissions.filter(p => p !== permission));
    } else {
      setter([...currentPermissions, permission]);
    }
  };

  const toggleCategoryPermission = (
    category: string,
    allPermissions: string[],
    currentPermissions: string[],
    setter: (value: string[]) => void
  ) => {
    const categoryPerms = allPermissions.filter(p => p.startsWith(`${category}.`));
    const allSelected = categoryPerms.every(p => currentPermissions.includes(p));
    
    if (allSelected) {
      // 取消全选
      setter(currentPermissions.filter(p => !categoryPerms.includes(p)));
    } else {
      // 全选
      setter([...new Set([...currentPermissions, ...categoryPerms])]);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // 按模块分组权限
  const groupedPermissions = defaultPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof defaultPermissions>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">角色管理</h1>
          <p className="text-muted-foreground">
            管理用户角色和权限
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建角色
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>新建角色</DialogTitle>
              <DialogDescription>
                创建一个新角色并配置权限
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">角色标识</Label>
                <Input
                  id="name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="例如: sales_lead"
                />
                <p className="text-xs text-muted-foreground">
                  角色标识只能包含小写字母、数字和下划线
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">角色描述</Label>
                <Textarea
                  id="description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="描述角色的职责..."
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2 flex-1 overflow-hidden">
                <Label>权限配置</Label>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                      <div key={category} className="border rounded-lg p-4">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleCategory(category)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedCategories.has(category) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">{getCategoryLabel(category)}</span>
                          </div>
                          <Checkbox
                            checked={perms.every(p => newRole.permissions.includes(p.name))}
                            onCheckedChange={() => toggleCategoryPermission(category, defaultPermissions.map(p => p.name), newRole.permissions, (val) => setNewRole({ ...newRole, permissions: val }))}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        
                        {expandedCategories.has(category) && (
                          <div className="mt-3 pl-6 space-y-2">
                            {perms.map((perm) => (
                              <div key={perm.name} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm">{perm.label}</p>
                                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                                </div>
                                <Checkbox
                                  checked={newRole.permissions.includes(perm.name)}
                                  onCheckedChange={() => togglePermission(perm.name, newRole.permissions, (val) => setNewRole({ ...newRole, permissions: val }))}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateRole}>
                创建角色
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  {role.is_system && (
                    <Badge variant="secondary" className="text-xs">系统</Badge>
                  )}
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {role.description || '暂无描述'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">权限数量</span>
                  <span className="font-medium">{role.permissions.length} 项</span>
                </div>
                
                <Separator />
                
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 5).map((perm) => (
                    <Badge key={perm} variant="outline" className="text-xs">
                      {perm.split('.')[1]}
                    </Badge>
                  ))}
                  {role.permissions.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{role.permissions.length - 5}
                    </Badge>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(role)}
                    disabled={role.is_system}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRole(role.id)}
                    disabled={role.is_system}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 编辑角色对话框 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>编辑角色 - {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              修改角色信息和权限配置
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">角色标识</Label>
              <Input
                id="edit-name"
                value={editRole.name}
                onChange={(e) => setEditRole({ ...editRole, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                disabled={selectedRole?.is_system}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">角色描述</Label>
              <Textarea
                id="edit-description"
                value={editRole.description}
                onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2 flex-1 overflow-hidden">
              <Label>权限配置</Label>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleCategory(category)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedCategories.has(category) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">{getCategoryLabel(category)}</span>
                        </div>
                        <Checkbox
                          checked={perms.every(p => editRole.permissions.includes(p.name))}
                          onCheckedChange={() => toggleCategoryPermission(category, defaultPermissions.map(p => p.name), editRole.permissions, (val) => setEditRole({ ...editRole, permissions: val }))}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      {expandedCategories.has(category) && (
                        <div className="mt-3 pl-6 space-y-2">
                          {perms.map((perm) => (
                            <div key={perm.name} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm">{perm.label}</p>
                                <p className="text-xs text-muted-foreground">{perm.description}</p>
                              </div>
                              <Checkbox
                                checked={editRole.permissions.includes(perm.name)}
                                onCheckedChange={() => togglePermission(perm.name, editRole.permissions, (val) => setEditRole({ ...editRole, permissions: val }))}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditRole}>
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
