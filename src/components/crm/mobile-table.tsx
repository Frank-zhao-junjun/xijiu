'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MobileTableColumn<T> {
  key: string;
  header: string;
  width?: string;
  render?: (item: T) => ReactNode;
}

export interface MobileTableAction<T> {
  label: string;
  onClick: (item: T) => void;
  variant?: 'default' | 'destructive' | 'outline';
}

export interface MobileTableProps<T> {
  data: T[];
  columns: MobileTableColumn<T>[];
  keyField: keyof T;
  titleField: keyof T;
  subtitleField?: keyof T;
  actions?: MobileTableAction<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function MobileTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  titleField,
  subtitleField,
  actions,
  onRowClick,
  emptyMessage = '暂无数据',
  className,
}: MobileTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <ChevronRight className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {data.map((item, index) => {
        const itemKey = String(item[keyField]);
        const title = String(item[titleField]);
        const subtitle = subtitleField ? String(item[subtitleField]) : undefined;
        const isClickable = !!onRowClick;

        return (
          <Card
            key={itemKey}
            className={cn(
              'transition-all duration-200',
              isClickable && 'hover:shadow-md hover:border-primary/30 cursor-pointer',
              'animate-in slide-in-from-bottom-2',
            )}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    'font-semibold truncate',
                    isClickable && 'group-hover:text-primary transition-colors'
                  )}>
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                  
                  {/* Mobile-specific: show key columns as badge list */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {columns.slice(0, 3).map((col) => {
                      if (col.key === titleField || col.key === keyField) return null;
                      const value = item[col.key];
                      return (
                        <Badge
                          key={col.key}
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          <span className="text-muted-foreground mr-1">{col.header}:</span>
                          {col.render ? col.render(item) : String(value ?? '-')}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {actions && actions.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  ) : isClickable ? (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  ) : null}
                </div>
              </div>

              {/* Actions row */}
              {actions && actions.length > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  {actions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant={action.variant || 'outline'}
                      size="sm"
                      className="h-8 text-xs flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(item);
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
