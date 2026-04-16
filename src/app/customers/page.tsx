'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Mail, Phone, Building2, Users, ChevronRight, Trash2, Download, FileSpreadsheet, Tag, X } from 'lucide-react';
import { CustomerStatus, Customer } from '@/lib/crm-types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Tag as TagType } from '@/storage/database/shared/schema';

const statusConfig: Record<CustomerStatus, { label: string; className: string; gradient: string }> = {
  active: { 
    label: '活跃', 
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    gradient: 'from-green-500 to-emerald-500'
  },
  inactive: { 
    label: '非活跃', 
    className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    gradient: 'from-gray-500 to-slate-500'
  },
  prospect: { 
    label: '潜在客户', 
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    gradient: 'from-blue-500 to-cyan-500'
  },
};

function CustomerAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <Avatar className={cn("ring-2 ring-offset-2 ring-primary/10", className)}>
      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

// 导出函数
async function handleExport(format: 'csv' | 'xlsx') {
  try {
    const response = await fetch(`/api/export?type=customers&format=${format}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '导出失败');
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    alert(`导出失败: ${(error as Error).message}`);
  }
}

export default function CustomersPage() {
  const router = useRouter();
  const { customers, deleteCustomer } = useCRM();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [filteredByTag, setFilteredByTag] = useState<Customer[] | null>(null);
  const [loadingByTag, setLoadingByTag] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 获取所有标签
  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setAllTags(data);
      }
    } catch (err) {
      console.error('获取标签失败:', err);
    }
  }

  // 按标签筛选客户
  useEffect(() => {
    if (tagFilter === 'all') {
      setFilteredByTag(null);
      return;
    }

    const fetchFilteredCustomers = async () => {
      setLoadingByTag(true);
      try {
        const res = await fetch(`/api/customers/filter-by-tag?tagId=${tagFilter}`);
        if (res.ok) {
          const data = await res.json();
          // 转换数据格式以匹配前端类型
          const convertedData: Customer[] = data.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: c.name as string,
            email: (c.email as string) || '',
            phone: (c.phone as string) || '',
            company: c.company as string,
            status: c.status as CustomerStatus,
            industry: (c.industry as string) || '',
            website: c.website as string | undefined,
            address: c.address as string | undefined,
            notes: c.notes as string | undefined,
            createdAt: c.created_at as string,
            updatedAt: c.updated_at as string,
          }));
          setFilteredByTag(convertedData);
        }
      } catch (err) {
        console.error('按标签筛选客户失败:', err);
      } finally {
        setLoadingByTag(false);
      }
    };

    fetchFilteredCustomers();
  }, [tagFilter]);

  // 获取当前显示的客户列表
  const displayCustomers = filteredByTag || customers;

  const filteredCustomers = displayCustomers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.company.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteCustomer(deleteId);
      setDeleteId(null);
    }
  };

  // 获取当前选中的标签
  const selectedTag = allTags.find(t => t.id === tagFilter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-pink-500/5 rounded-3xl -z-10" />
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">客户管理</h1>
            <p className="text-muted-foreground mt-1">
              共 {filteredCustomers.length} 个客户
              {tagFilter !== 'all' && selectedTag && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedTag.color }}
                  />
                  <span style={{ color: selectedTag.color }}>筛选自: {selectedTag.name}</span>
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  导出
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  导出为 CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  导出为 Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              onClick={() => router.push('/customers/new')}
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              新建客户
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索客户名称、公司或邮箱..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-background/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-11">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">非活跃</SelectItem>
                <SelectItem value="prospect">潜在客户</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-11">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <SelectValue placeholder="按标签筛选" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部标签</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tagFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTagFilter('all');
                  setFilteredByTag(null);
                }}
                className="h-11 px-3 gap-1"
              >
                <X className="h-4 w-4" />
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loadingByTag && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              正在按标签筛选客户...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table */}
      {!loadingByTag && (
        <Card className="hidden md:block card-hover">
          <CardContent className="p-0">
            {filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-1">暂无客户</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {tagFilter !== 'all' ? '该标签下没有客户' : '开始添加你的第一个客户吧'}
                </p>
                <Button 
                  onClick={() => router.push('/customers/new')}
                  className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  <Plus className="h-4 w-4" />
                  新建客户
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">客户</TableHead>
                    <TableHead className="font-semibold">公司</TableHead>
                    <TableHead className="font-semibold">联系方式</TableHead>
                    <TableHead className="font-semibold">状态</TableHead>
                    <TableHead className="font-semibold">创建时间</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, index) => {
                    const status = statusConfig[customer.status];
                    return (
                      <TableRow 
                        key={customer.id}
                        className={cn(
                          "group cursor-pointer transition-all duration-200",
                          "hover:bg-accent/50"
                        )}
                        onClick={() => router.push(`/customers/${customer.id}`)}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <CustomerAvatar name={customer.name} />
                            <span className="font-medium group-hover:text-primary transition-colors">
                              {customer.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            {customer.company}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">{customer.email || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">{customer.phone || '-'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(status.className)}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full mr-1.5",
                              "bg-gradient-to-r",
                              status.gradient
                            )} />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(customer.createdAt), 'yyyy/MM/dd', { locale: zhCN })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(customer.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile Cards */}
      {!loadingByTag && (
        <div className="grid gap-4 md:hidden">
          {filteredCustomers.length === 0 ? (
            <Card className="card-hover">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">暂无客户数据</p>
                <Button 
                  onClick={() => router.push('/customers/new')}
                  className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  <Plus className="h-4 w-4" />
                  新建客户
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer, index) => {
              const status = statusConfig[customer.status];
              return (
                <Card 
                  key={customer.id}
                  className={cn(
                    "cursor-pointer card-hover",
                    "animate-in slide-in-from-bottom-2",
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => router.push(`/customers/${customer.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <CustomerAvatar name={customer.name} className="w-10 h-10" />
                        <div>
                          <h3 className="font-semibold">{customer.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {customer.company}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn(status.className)}>
                        {status.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {customer.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[150px]">{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        创建于 {format(new Date(customer.createdAt), 'yyyy/MM/dd', { locale: zhCN })}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              确认删除客户
            </DialogTitle>
            <DialogDescription>
              确定要删除这个客户吗？此操作不可撤销，相关联系人和商机也会被一并删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
