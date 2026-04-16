'use client';

import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { NotificationBell } from './notification-bell';
import { GlobalSearch } from './global-search';

const pageTitles: Record<string, string> = {
  '/': '仪表盘',
  '/customers': '客户管理',
  '/customers/new': '新建客户',
  '/opportunities': '商机',
  '/opportunities/new': '新建商机',
  '/quotes': '报价单',
  '/quotes/new': '新建报价单',
  '/orders': '订单',
  '/orders/new': '新建订单',
  '/contacts': '联系人',
  '/contacts/new': '新建联系人',
  '/tasks': '任务管理',
  '/workflows': '工作流自动化',
  '/settings': '系统设置',
  '/leads': '销售线索',
  '/leads/new': '新建线索',
};

export function Header() {
  const pathname = usePathname();
  
  const title = pageTitles[pathname] || 'CRM系统';
  
  // Extract dynamic route title
  const getDynamicTitle = () => {
    if (pathname.match(/^\/customers\/[^/]+$/)) return '客户详情';
    if (pathname.match(/^\/customers\/[^/]+\/edit$/)) return '编辑客户';
    if (pathname.match(/^\/opportunities\/[^/]+$/)) return '商机详情';
    if (pathname.match(/^\/opportunities\/[^/]+\/edit$/)) return '编辑商机';
    if (pathname.match(/^\/quotes\/[^/]+$/)) return '报价单详情';
    if (pathname.match(/^\/quotes\/[^/]+\/edit$/)) return '编辑报价单';
    if (pathname.match(/^\/orders\/[^/]+$/)) return '订单详情';
    if (pathname.match(/^\/orders\/[^/]+\/edit$/)) return '编辑订单';
    if (pathname.match(/^\/contacts\/[^/]+$/)) return '联系人详情';
    if (pathname.match(/^\/contacts\/[^/]+\/edit$/)) return '编辑联系人';
    if (pathname.match(/^\/leads\/[^/]+$/)) return '线索详情';
    return title;
  };

  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{getDynamicTitle()}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Global Search */}
          <GlobalSearch className="hidden md:block" />
          
          <NotificationBell />
          
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
