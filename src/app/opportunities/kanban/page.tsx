'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { KanbanBoard } from '@/components/crm/kanban-board';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  List,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { OpportunityStage, OPPORTUNITY_STAGE_CONFIG } from '@/lib/crm-types';
import Link from 'next/link';

export default function OpportunitiesKanbanPage() {
  const router = useRouter();
  const { opportunities: opportunitiesData, updateOpportunity } = useCRM();
  
  const opportunities = opportunitiesData;
  
  const handleOpportunityMove = useCallback(
    (opportunityId: string, newStage: OpportunityStage) => {
      const opportunity = opportunities.find((o) => o.id === opportunityId);
      if (!opportunity) return;

      const stageConfig = OPPORTUNITY_STAGE_CONFIG[newStage];
      
      updateOpportunity(opportunityId, {
        stage: newStage,
        probability: stageConfig.defaultProbability,
      });

      // Save to localStorage for persistence
      try {
        const savedData = localStorage.getItem('crm_opportunities');
        if (savedData) {
          const allOpportunities = JSON.parse(savedData);
          const updated = allOpportunities.map((opp: { id: string; stage: OpportunityStage; probability: number }) => 
            opp.id === opportunityId
              ? { ...opp, stage: newStage, probability: stageConfig.defaultProbability }
              : opp
          );
          localStorage.setItem('crm_opportunities', JSON.stringify(updated));
        }
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    },
    [opportunities, updateOpportunity]
  );

  const handleOpportunityClick = useCallback(
    (opportunity: { id: string }) => {
      router.push(`/opportunities/${opportunity.id}`);
    },
    [router]
  );

  // Stats for header
  const stats = useMemo(() => {
    const activeOpps = opportunities.filter(
      (o) => o.stage !== 'closed_won' && o.stage !== 'closed_lost'
    );
    const totalValue = activeOpps.reduce((sum, o) => sum + o.value, 0);
    const wonValue = opportunities
      .filter((o) => o.stage === 'closed_won')
      .reduce((sum, o) => sum + o.value, 0);

    return {
      total: opportunities.length,
      active: activeOpps.length,
      totalValue,
      wonValue,
    };
  }, [opportunities]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-4 p-4">
          {/* Top Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/opportunities">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">商机看板</h1>
                <p className="text-sm text-muted-foreground">
                  拖拽管理商机阶段 · {stats.total} 个商机
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/opportunities">
                <Button variant="outline" size="sm" className="gap-2">
                  <List className="h-4 w-4" />
                  列表视图
                </Button>
              </Link>
              <Link href="/opportunities/new">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500">
                  <Plus className="h-4 w-4" />
                  新建商机
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">进行中</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {stats.active}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">进行中总额</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ¥{stats.totalValue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">已成交</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ¥{stats.wonValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden p-4">
        {opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center mb-4">
              <LayoutGrid className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm mb-4">暂无商机数据</p>
            <Link href="/opportunities/new">
              <Button className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500">
                <Plus className="h-4 w-4" />
                创建第一个商机
              </Button>
            </Link>
          </div>
        ) : (
          <KanbanBoard
            opportunities={opportunities}
            onOpportunityMove={handleOpportunityMove}
            onOpportunityClick={handleOpportunityClick}
          />
        )}
      </div>
    </div>
  );
}
