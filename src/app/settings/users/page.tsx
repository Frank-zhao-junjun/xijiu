'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Users, Edit, Trash2, Shield,
  Search
} from 'lucide-react';

interface User {
  id: string;
  user_id: string;
  user_name?: string;
  roles: Array<{
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
    permissions?: string[];
  }>;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // 分配角色表单
  const [assignedRoles, setAssignedRoles] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      let rolesList: Role[] = [];

      const rolesResponse = await fetch('/api/roles');
      if (rolesResponse.ok) {
        rolesList = await rolesResponse.json();
        setRoles(rolesList);
      }

      const usersResponse = await fetch('/api/users/roles');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      } else {
        setUsers([
          {
            id: '1',
            user_id: 'user_001',
            user_name: '张三',
            roles: [rolesList[0] || { id: '1', name: 'admin', description: '管理员', is_system: true, permissions: [] }],
          },
          {
            id: '2',
            user_id: 'user_002',
            user_name: '李四',
            roles: [rolesList[1] || { id: '2', name: 'sales_manager', description: '销售经理', is_system: true, permissions: [] }],
          },
          {
            id: '3',
            user_id: 'user_003',
            user_name: '王五',
            roles: [rolesList[2] || { id: '3', name: 'sales_rep', description: '销售人员', is_system: true, permissions: [] }],
          },
        ]);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      // 使用默认数据
      setUsers([
        {
          id: '1',
          user_id: 'user_001',
          user_name: '张三',
          roles: [{ id: '1', name: 'admin', description: '管理员', is_system: true, permissions: [] }],
        },
        {
          id: '2',
          user_id: 'user_002',
          user_name: '李四',
          roles: [{ id: '2', name: 'sales_manager', description: '销售经理', is_system: true, permissions: [] }],
        },
        {
          id: '3',
          user_id: 'user_003',
          user_name: '王五',
          roles: [{ id: '3', name: 'sales_rep', description: '销售人员', is_system: true, permissions: [] }],
        },
      ]);
      setRoles([
        { id: '1', name: 'admin', description: '系统管理员', is_system: true, permissions: [] },
        { id: '2', name: 'sales_manager', description: '销售经理', is_system: true, permissions: [] },
        { id: '3', name: 'sales_rep', description: '销售人员', is_system: true, permissions: [] },
        { id: '4', name: 'guest', description: '访客', is_system: true, permissions: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRoles = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/users/${selectedUser.user_id}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_ids: assignedRoles,
        }),
      });
      
      if (response.ok) {
        await fetchData();
        setIsAssignOpen(false);
        setSelectedUser(null);
        setAssignedRoles([]);
      } else {
        const error = await response.json();
        alert(error.error || '分配失败');
      }
    } catch (error) {
      console.error('分配角色失败:', error);
      alert('分配失败');
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId }),
      });
      
      if (response.ok) {
        await fetchData();
      } else {
        alert('移除失败');
      }
    } catch (error) {
      console.error('移除角色失败:', error);
      alert('移除失败');
    }
  };

  const openAssignDialog = (user: User) => {
    setSelectedUser(user);
    setAssignedRoles(user.roles.map(r => r.id));
    setIsAssignOpen(true);
  };

  const toggleRole = (roleId: string) => {
    if (assignedRoles.includes(roleId)) {
      setAssignedRoles(assignedRoles.filter(id => id !== roleId));
    } else {
      setAssignedRoles([...assignedRoles, roleId]);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.user_id.toLowerCase().includes(searchLower) ||
      user.user_name?.toLowerCase().includes(searchLower)
    );
  });

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
          <h1 className="text-3xl font-bold tracking-tight">用户角色管理</h1>
          <p className="text-muted-foreground">
            分配和管理用户角色
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[250px]"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            用户列表
          </CardTitle>
          <CardDescription>
            管理和分配用户角色
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户ID</TableHead>
                <TableHead>用户名</TableHead>
                <TableHead>当前角色</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.user_id}
                  </TableCell>
                  <TableCell>
                    {user.user_name || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge
                          key={role.id}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <Shield className="h-3 w-3" />
                          {role.name}
                          {role.is_system && (
                            <span className="text-xs opacity-60">系统</span>
                          )}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-sm text-muted-foreground">未分配角色</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignDialog(user)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        分配角色
                      </Button>
                      {user.roles.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRole(user.user_id, user.roles[0].id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-muted-foreground">
                      未找到匹配的用户
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分配角色对话框 */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>分配角色</DialogTitle>
            <DialogDescription>
              为用户 {selectedUser?.user_name || selectedUser?.user_id} 分配角色
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleRole(role.id)}
                >
                  <Checkbox
                    checked={assignedRoles.includes(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.name}</span>
                      {role.is_system && (
                        <Badge variant="outline" className="text-xs">系统</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description || '暂无描述'}
                    </p>
                    {role.permissions && role.permissions.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        包含 {role.permissions.length} 项权限
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAssignRoles}>
              保存分配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
