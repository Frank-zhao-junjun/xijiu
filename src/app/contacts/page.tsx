'use client';

import { useState } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Mail, Phone, ChevronRight, Trash2, Contact2, Download, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function ContactAvatar({ firstName, lastName, className }: { firstName: string; lastName: string; className?: string }) {
  const initials = `${lastName}${firstName}`.slice(0, 2).toUpperCase();
  const gradients = [
    'from-green-400 to-emerald-500',
    'from-blue-400 to-cyan-500',
    'from-purple-400 to-pink-500',
    'from-orange-400 to-amber-500',
    'from-rose-400 to-red-500',
  ];
  const gradient = gradients[initials.charCodeAt(0) % gradients.length];
  
  return (
    <Avatar className={cn("ring-2 ring-offset-2 ring-primary/10", className)}>
      <AvatarFallback className={cn(
        "bg-gradient-to-br text-white font-semibold",
        gradient
      )}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

// 导出函数
async function handleExport(format: 'csv' | 'xlsx') {
  try {
    const response = await fetch(`/api/export?type=contacts&format=${format}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '导出失败');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    alert(`导出失败: ${(error as Error).message}`);
  }
}

export default function ContactsPage() {
  const router = useRouter();
  const { contacts, deleteContact } = useCRM();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.lastName}${contact.firstName}`;
    return (
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      contact.email.toLowerCase().includes(search.toLowerCase()) ||
      contact.customerName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteContact(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5 rounded-3xl -z-10" />
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">联系人</h1>
            <p className="text-muted-foreground mt-1">
              共 {filteredContacts.length} 个联系人
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
              onClick={() => router.push('/contacts/new')}
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/25 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              新建联系人
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索联系人姓名、邮箱或客户..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="hidden md:block card-hover">
        <CardContent className="p-0">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center mb-4">
                <Contact2 className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-1">暂无联系人</h3>
              <p className="text-sm text-muted-foreground mb-4">开始添加你的第一个联系人</p>
              <Button 
                onClick={() => router.push('/contacts/new')}
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500"
              >
                <Plus className="h-4 w-4" />
                新建联系人
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">联系人</TableHead>
                  <TableHead className="font-semibold">职位</TableHead>
                  <TableHead className="font-semibold">所属客户</TableHead>
                  <TableHead className="font-semibold">联系方式</TableHead>
                  <TableHead className="font-semibold">主要联系人</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact, index) => (
                  <TableRow 
                    key={contact.id}
                    className={cn(
                      "group cursor-pointer transition-all duration-200",
                      "hover:bg-accent/50"
                    )}
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ContactAvatar 
                          firstName={contact.firstName} 
                          lastName={contact.lastName}
                          className="w-9 h-9"
                        />
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {contact.lastName}{contact.firstName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{contact.position || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {contact.customerName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{contact.email || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{contact.phone || '-'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.isPrimary && (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                          主要联系人
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(contact.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="grid gap-4 md:hidden">
        {filteredContacts.length === 0 ? (
          <Card className="card-hover">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center mb-4">
                <Contact2 className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">暂无联系人数据</p>
              <Button 
                onClick={() => router.push('/contacts/new')}
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500"
              >
                <Plus className="h-4 w-4" />
                新建联系人
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredContacts.map((contact, index) => (
            <Card 
              key={contact.id}
              className={cn(
                "cursor-pointer card-hover",
                "animate-in slide-in-from-bottom-2",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => router.push(`/contacts/${contact.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <ContactAvatar 
                      firstName={contact.firstName} 
                      lastName={contact.lastName}
                      className="w-12 h-12"
                    />
                    <div>
                      <h3 className="font-semibold">{contact.lastName}{contact.firstName}</h3>
                      <p className="text-sm text-muted-foreground">{contact.position || '未设置职位'}</p>
                    </div>
                  </div>
                  {contact.isPrimary && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                      主要
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <Badge variant="secondary" className="font-normal mr-2">
                    {contact.customerName}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {contact.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[140px]">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">查看详情</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              确认删除联系人
            </DialogTitle>
            <DialogDescription>
              确定要删除这个联系人吗？此操作不可撤销。
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
