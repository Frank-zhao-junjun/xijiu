'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  List,
  Plus,
  ArrowLeft,
  GripVertical,
  Building2,
  DollarSign,
  User,
} from 'lucide-react';
import Link from 'next/link';
import {
  LeadStatusType,
  LEAD_STATUS_CONFIG,
  SalesLead,
} from '@/lib/crm-types';

const ACTIVE_STATUSES: LeadStatusType[] = ['new', 'contacted', 'qualified'];

interface LeadColumnProps {
  id: LeadStatusType;
  title: string;
  color: string;
  gradient: string;
  count: number;
  leads: SalesLead[];
  onCardClick: (lead: SalesLead) => void;
}

function LeadColumn({
  id,
  title,
  color,
  gradient,
  count,
  leads,
  onCardClick,
}: LeadColumnProps) {
  const { setNodeRef, transform, transition, isOver } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col w-72 flex-shrink-0 bg-muted/30 rounded-xl',
        'border border-transparent transition-all duration-200',
        isOver && 'border-primary/50 bg-primary/5'
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded-full bg-gradient-to-br', gradient)} />
          <h3 className={cn('font-semibold text-sm', color)}>{title}</h3>
        </div>
        <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium bg-background/80 text-muted-foreground">
          {count}
        </span>
      </div>

      <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2 p-2 min-h-[100px]">
            {leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
                <p className="text-xs">暂无线索</p>
              </div>
            ) : (
              leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onCardClick(lead)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

interface LeadCardProps {
  lead: SalesLead;
  onClick: () => void;
}

function LeadCard({ lead, onClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusConfig = LEAD_STATUS_CONFIG[lead.status];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group', isDragging && 'opacity-50')}
    >
      <Card
        className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 border-border/50"
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <button
              className={cn(
                'mt-0.5 p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted'
              )}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate leading-tight">
                {lead.title}
              </h4>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{lead.customerName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ¥{lead.estimatedValue.toLocaleString()}
              </span>
            </div>
            <Badge variant="outline" className={cn('text-xs', statusConfig.className)}>
              {lead.probability}%
            </Badge>
          </div>

          {lead.contactName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{lead.contactName}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LeadsKanbanPage() {
  const router = useRouter();
  const { leads, updateLead } = useCRM();

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const leadsByStatus: Record<LeadStatusType, SalesLead[]> = useMemo(() => {
    const grouped: Record<LeadStatusType, SalesLead[]> = {
      new: [],
      contacted: [],
      qualified: [],
      disqualified: [],
    };

    (leads as SalesLead[]).forEach((lead: SalesLead) => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });

    return grouped;
  }, [leads]);

  const activeLead = useMemo(() => {
    if (!activeId) return null;
    return leads.find((l) => l.id === activeId) || null;
  }, [activeId, leads]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    let newStatus: LeadStatusType | null = null;

    if (ACTIVE_STATUSES.includes(overId as LeadStatusType)) {
      newStatus = overId as LeadStatusType;
    } else {
      const overLead = leads.find((l) => l.id === overId);
      if (overLead) {
        newStatus = overLead.status;
      }
    }

    if (newStatus) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead && lead.status !== newStatus) {
        updateLead(leadId, { status: newStatus });
      }
    }
  };

  const handleLeadClick = (lead: SalesLead) => {
    router.push(`/leads/${lead.id}`);
  };

  const stats = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter((l) => l.status === 'qualified').length;
    return { total, qualified };
  }, [leads]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/leads">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">线索看板</h1>
                <p className="text-sm text-muted-foreground">
                  拖拽管理线索状态 · {stats.total} 条线索
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/leads">
                <Button variant="outline" size="sm" className="gap-2">
                  <List className="h-4 w-4" />
                  列表视图
                </Button>
              </Link>
              <Link href="/leads/new">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500">
                  <Plus className="h-4 w-4" />
                  新建线索
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">线索总数</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {stats.total}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">已合格</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {stats.qualified}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden p-4">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center mb-4">
              <LayoutGrid className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm mb-4">暂无线索数据</p>
            <Link href="/leads/new">
              <Button className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500">
                <Plus className="h-4 w-4" />
                创建第一条线索
              </Button>
            </Link>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <ScrollArea className="w-full">
              <div className="flex gap-4 p-1 min-w-max">
                {ACTIVE_STATUSES.map((status) => {
                  const config = LEAD_STATUS_CONFIG[status];
                  return (
                    <LeadColumn
                      key={status}
                      id={status}
                      title={config.label}
                      color={config.color}
                      gradient={LEAD_STATUS_CONFIG[status].label.includes('新')
                        ? 'from-blue-400 to-blue-500'
                        : config.label.includes('已联系')
                        ? 'from-purple-400 to-purple-500'
                        : 'from-green-400 to-green-500'}
                      count={leadsByStatus[status].length}
                      leads={leadsByStatus[status]}
                      onCardClick={handleLeadClick}
                    />
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <DragOverlay>
              {activeLead && (
                <Card className="rotate-3 shadow-2xl w-72">
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm">{activeLead.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeLead.customerName}
                    </p>
                  </CardContent>
                </Card>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
