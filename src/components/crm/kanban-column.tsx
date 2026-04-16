'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { KanbanCard } from './kanban-card';
import { SalesOpportunity } from '@/lib/crm-types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  gradient: string;
  count: number;
  opportunities: SalesOpportunity[];
  onCardClick: (opportunity: SalesOpportunity) => void;
}

export function KanbanColumn({
  id,
  title,
  color,
  gradient,
  count,
  opportunities,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-72 flex-shrink-0 bg-muted/30 rounded-xl',
        'border border-transparent transition-all duration-200',
        isOver && 'border-primary/50 bg-primary/5'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-3 h-3 rounded-full bg-gradient-to-br',
              gradient
            )}
          />
          <h3 className={cn('font-semibold text-sm', color)}>{title}</h3>
        </div>
        <span
          className={cn(
            'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
            'bg-background/80 text-muted-foreground'
          )}
        >
          {count}
        </span>
      </div>

      {/* Cards Container */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
        <div className="flex flex-col gap-2 p-2 min-h-[100px]">
          {opportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
              <p className="text-xs">暂无商机</p>
              <p className="text-[10px] mt-1">拖拽商机到此处</p>
            </div>
          ) : (
            opportunities.map((opportunity) => (
              <KanbanCard
                key={opportunity.id}
                opportunity={opportunity}
                onClick={() => onCardClick(opportunity)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
