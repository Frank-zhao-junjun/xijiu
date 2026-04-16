'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, Calendar, DollarSign, GripVertical } from 'lucide-react';
import { SalesOpportunity, OPPORTUNITY_STAGE_CONFIG } from '@/lib/crm-types';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface KanbanCardProps {
  opportunity: SalesOpportunity;
  onClick: () => void;
  isDragging?: boolean;
}

export function KanbanCard({
  opportunity,
  onClick,
  isDragging = false,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const stageConfig = OPPORTUNITY_STAGE_CONFIG[opportunity.stage];

  const handleClick = (_e: React.MouseEvent) => {
    // Don't trigger click if we're dragging
    if (!isSortableDragging) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group',
        isSortableDragging && 'opacity-50',
        isDragging && 'rotate-3 shadow-2xl'
      )}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200',
          'hover:shadow-md hover:border-primary/30',
          'active:scale-[0.98]',
          'border-border/50'
        )}
        onClick={handleClick}
      >
        <CardContent className="p-3 space-y-3">
          {/* Drag Handle & Title */}
          <div className="flex items-start gap-2">
            <button
              className={cn(
                'mt-0.5 p-1 rounded cursor-grab active:cursor-grabbing',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'hover:bg-muted'
              )}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate leading-tight">
                {opportunity.title}
              </h4>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{opportunity.customerName}</span>
              </div>
            </div>
          </div>

          {/* Value & Probability */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ¥{opportunity.value.toLocaleString()}
              </span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-1.5 py-0',
                stageConfig.className
              )}
            >
              {opportunity.probability}%
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress
              value={opportunity.probability}
              className={cn(
                'h-1.5',
                '[&>div]:bg-gradient-to-r',
                opportunity.stage === 'closed_won'
                  ? '[&>div]:from-green-400 [&>div]:to-emerald-500'
                  : opportunity.stage === 'closed_lost'
                  ? '[&>div]:from-red-400 [&>div]:to-rose-500'
                  : '[&>div]:from-orange-400 [&>div]:to-amber-500'
              )}
            />
          </div>

          {/* Footer: Expected Close Date */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {opportunity.expectedCloseDate
                  ? format(parseISO(opportunity.expectedCloseDate), 'MM/dd', {
                      locale: zhCN,
                    })
                  : '未设置'}
              </span>
            </div>
            {opportunity.contactName && (
              <span className="truncate max-w-[100px]">
                {opportunity.contactName}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
