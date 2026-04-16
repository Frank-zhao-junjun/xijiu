'use client';

import React, { useMemo, useState } from 'react';
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
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { SalesOpportunity, OpportunityStage, OPPORTUNITY_STAGE_CONFIG } from '@/lib/crm-types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface KanbanBoardProps {
  opportunities: SalesOpportunity[];
  onOpportunityMove: (opportunityId: string, newStage: OpportunityStage) => void;
  onOpportunityClick: (opportunity: SalesOpportunity) => void;
}

const ACTIVE_STAGES: OpportunityStage[] = [
  'qualified',
  'discovery',
  'proposal',
  'negotiation',
  'contract',
  'closed_won',
];

export function KanbanBoard({
  opportunities,
  onOpportunityMove,
  onOpportunityClick,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group opportunities by stage
  const opportunitiesByStage = useMemo(() => {
    const grouped: Record<OpportunityStage, SalesOpportunity[]> = {
      qualified: [],
      discovery: [],
      proposal: [],
      negotiation: [],
      contract: [],
      closed_won: [],
      closed_lost: [],
    };

    opportunities.forEach((opp) => {
      if (grouped[opp.stage]) {
        grouped[opp.stage].push(opp);
      }
    });

    return grouped;
  }, [opportunities]);

  // Get active opportunity for drag overlay
  const activeOpportunity = useMemo(() => {
    if (!activeId) return null;
    return opportunities.find((opp) => opp.id === activeId) || null;
  }, [activeId, opportunities]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Handle drag over for real-time updates if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const opportunityId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a column
    if (ACTIVE_STAGES.includes(overId as OpportunityStage)) {
      const newStage = overId as OpportunityStage;
      const opportunity = opportunities.find((opp) => opp.id === opportunityId);
      if (opportunity && opportunity.stage !== newStage) {
        onOpportunityMove(opportunityId, newStage);
      }
    } else {
      // Dropped over another card - find its stage
      const overOpportunity = opportunities.find((opp) => opp.id === overId);
      if (overOpportunity) {
        const newStage = overOpportunity.stage;
        const opportunity = opportunities.find((opp) => opp.id === opportunityId);
        if (opportunity && opportunity.stage !== newStage) {
          onOpportunityMove(opportunityId, newStage);
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-1 min-w-max">
          {ACTIVE_STAGES.map((stage) => {
            const stageConfig = OPPORTUNITY_STAGE_CONFIG[stage];
            const stageOpportunities = opportunitiesByStage[stage] || [];

            return (
              <SortableContext
                key={stage}
                items={stageOpportunities.map((opp) => opp.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  id={stage}
                  title={stageConfig.label}
                  color={stageConfig.color}
                  gradient={stageConfig.gradient}
                  count={stageOpportunities.length}
                  opportunities={stageOpportunities}
                  onCardClick={onOpportunityClick}
                />
              </SortableContext>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay>
        {activeOpportunity && (
          <KanbanCard
            opportunity={activeOpportunity}
            isDragging
            onClick={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
