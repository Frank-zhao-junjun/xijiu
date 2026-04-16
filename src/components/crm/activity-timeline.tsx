'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Pagination, PaginationContent, PaginationItem, 
  PaginationLink, PaginationNext, PaginationPrevious 
} from '@/components/ui/pagination';
import { Calendar, Filter, Activity as ActivityIcon, Loader2, ExternalLink, Building2, User, TrendingUp, FileText, FileCheck, Package } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 活动类型配置
const ACTIVITY_TYPE_CONFIG = {
  created: { label: '创建', color: 'bg-green-500', textColor: 'text-green-600' },
  updated: { label: '更新', color: 'bg-blue-500', textColor: 'text-blue-600' },
  deleted: { label: '删除', color: 'bg-red-500', textColor: 'text-red-600' },
  stage_change: { label: '阶段变更', color: 'bg-purple-500', textColor: 'text-purple-600' },
  closed_won: { label: '成交', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  closed_lost: { label: '输单', color: 'bg-gray-500', textColor: 'text-gray-600' },
} as const;

// 实体类型配置
const ENTITY_TYPE_CONFIG = {
  customer: { label: '客户', icon: Building2, path: '/customers' },
  contact: { label: '联系人', icon: User, path: '/contacts' },
  lead: { label: '线索', icon: TrendingUp, path: '/leads' },
  opportunity: { label: '商机', icon: TrendingUp, path: '/opportunities' },
  quote: { label: '报价单', icon: FileText, path: '/quotes' },
  order: { label: '订单', icon: Package, path: '/orders' },
  contract: { label: '合同', icon: FileCheck, path: '/contracts' },
} as const;

interface Activity {
  id: string;
  type: keyof typeof ACTIVITY_TYPE_CONFIG;
  entity_type: keyof typeof ENTITY_TYPE_CONFIG;
  entity_id: string;
  entity_name: string;
  description: string;
  timestamp: string;
}

interface ActivityFilters {
  entity_type?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
}

interface ActivityListResult {
  activities: Activity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ActivityTimelineProps {
  entityId?: string;
  entityType?: string;
  showFilters?: boolean;
  title?: string;
}

export function ActivityTimeline({ 
  entityId, 
  entityType, 
  showFilters = true, 
  title = '活动追踪' 
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (entityType) params.set('entity_type', entityType);
      if (entityId) params.set('entity_id', entityId);
      if (filters.entity_type && !entityType) params.set('entity_type', filters.entity_type);
      if (filters.type) params.set('type', filters.type);
      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);
      params.set('page', String(pagination.page));
      params.set('pageSize', String(pagination.pageSize));

      const res = await fetch(`/api/activities?${params.toString()}`);
      if (res.ok) {
        const data: ActivityListResult = await res.json();
        setActivities(data.activities);
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
        });
      }
    } catch (error) {
      console.error('获取活动失败:', error);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleFilterChange = (key: keyof ActivityFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getEntityPath = (type: string, id: string) => {
    const config = ENTITY_TYPE_CONFIG[type as keyof typeof ENTITY_TYPE_CONFIG];
    return config ? `${config.path}/${id}` : '#';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            {title}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            共 {pagination.total} 条记录
          </span>
        </div>
        
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            <Select 
              value={filters.entity_type || ''} 
              onValueChange={(v) => handleFilterChange('entity_type', v)}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="实体类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部类型</SelectItem>
                {Object.entries(ENTITY_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.type || ''} 
              onValueChange={(v) => handleFilterChange('type', v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="操作类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部操作</SelectItem>
                {Object.entries(ACTIVITY_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                className="h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                placeholder="开始日期"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="date"
                className="h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                placeholder="结束日期"
              />
            </div>

            {(filters.entity_type || filters.type || filters.start_date || filters.end_date) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFilters({})}
              >
                清除筛选
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无活动记录
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">操作类型</TableHead>
                  <TableHead className="w-[100px]">实体类型</TableHead>
                  <TableHead>实体名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead className="w-[180px]">时间</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => {
                  const typeConfig = ACTIVITY_TYPE_CONFIG[activity.type] || ACTIVITY_TYPE_CONFIG.updated;
                  const entityConfig = ENTITY_TYPE_CONFIG[activity.entity_type] || ENTITY_TYPE_CONFIG.customer;
                  const EntityIcon = entityConfig.icon;

                  return (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <Badge 
                          className={`${typeConfig.color} text-white`}
                          variant="default"
                        >
                          {typeConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <EntityIcon className="h-3 w-3" />
                          {entityConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {activity.entity_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] truncate">
                        {activity.description}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(activity.timestamp), 'yyyy-MM-dd HH:mm')}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: zhCN })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedActivity(activity)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(pagination.page - 1)}
                        className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            onClick={() => handlePageChange(pageNum)}
                            isActive={pagination.page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(pagination.page + 1)}
                        className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Activity Detail Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>活动详情</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={`${ACTIVITY_TYPE_CONFIG[selectedActivity.type]?.color || 'bg-gray-500'} text-white`}>
                  {ACTIVITY_TYPE_CONFIG[selectedActivity.type]?.label || '未知'}
                </Badge>
                <Badge variant="outline">
                  {ENTITY_TYPE_CONFIG[selectedActivity.entity_type]?.label || '未知'}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-medium">实体名称</h4>
                <p className="text-muted-foreground">{selectedActivity.entity_name}</p>
              </div>
              
              <div>
                <h4 className="font-medium">实体ID</h4>
                <p className="text-muted-foreground font-mono text-sm">{selectedActivity.entity_id}</p>
              </div>
              
              <div>
                <h4 className="font-medium">描述</h4>
                <p className="text-muted-foreground">{selectedActivity.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium">发生时间</h4>
                <p className="text-muted-foreground">
                  {format(new Date(selectedActivity.timestamp), 'yyyy年MM月dd日 HH:mm:ss')}
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" asChild>
                  <a href={getEntityPath(selectedActivity.entity_type, selectedActivity.entity_id)}>
                    查看实体详情
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
