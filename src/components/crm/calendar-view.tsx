'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  List,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export type CalendarViewType = 'month' | 'week';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: 'opportunity' | 'task' | 'activity';
  color?: string;
  customerId?: string;
  customerName?: string;
  opportunityId?: string;
  opportunityName?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  viewType: CalendarViewType;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarViewType) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop?: (eventId: string, newDate: Date) => void;
  onCreateEvent?: (date: Date) => void;
}

const EVENT_TYPE_CONFIG = {
  opportunity: {
    label: '商机',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
  },
  task: {
    label: '任务',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  activity: {
    label: '活动',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
  },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CalendarView({
  events,
  currentDate,
  viewType,
  onDateChange,
  onViewChange,
  onEventClick,
  onEventDrop,
  onCreateEvent,
}: CalendarViewProps) {
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  const goToPrevious = useCallback(() => {
    if (viewType === 'month') {
      onDateChange(subMonths(currentDate, 1));
    } else {
      onDateChange(subWeeks(currentDate, 1));
    }
  }, [viewType, currentDate, onDateChange]);

  const goToNext = useCallback(() => {
    if (viewType === 'month') {
      onDateChange(addMonths(currentDate, 1));
    } else {
      onDateChange(addWeeks(currentDate, 1));
    }
  }, [viewType, currentDate, onDateChange]);

  const goToToday = useCallback(() => {
    onDateChange(new Date());
  }, [onDateChange]);

  const getEventsForDate = useCallback(
    (date: Date) => {
      return events.filter((event) => {
        const eventStart = parseISO(event.startDate);
        const eventEnd = parseISO(event.endDate);
        return (
          date >= new Date(eventStart.toDateString()) &&
          date <= new Date(eventEnd.toDateString())
        );
      });
    },
    [events]
  );

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const monthGrid = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  const handleDragStart = useCallback((event: CalendarEvent) => {
    setDraggedEvent(event);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetDate: Date) => {
      e.preventDefault();
      if (draggedEvent && onEventDrop) {
        onEventDrop(draggedEvent.id, targetDate);
      }
      setDraggedEvent(null);
    },
    [draggedEvent, onEventDrop]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedEvent(null);
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold">
            {format(currentDate, viewType === 'month' ? 'yyyy年 M月' : 'yyyy年 M月 d日', { locale: zhCN })}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            今天
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewType === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('month')}
              className="h-8 px-3"
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              月
            </Button>
            <Button
              variant={viewType === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('week')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1" />
              周
            </Button>
          </div>

          {onCreateEvent && (
            <Button size="sm" onClick={() => onCreateEvent(currentDate)}>
              <Plus className="h-4 w-4 mr-1" />
              新建事件
            </Button>
          )}
        </div>
      </div>

      {/* Month View */}
      {viewType === 'month' && (
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
              <div
                key={day}
                className={cn(
                  'py-3 text-center text-sm font-medium',
                  day === '周六' && 'text-blue-600',
                  day === '周日' && 'text-red-600'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-7 h-full">
              {monthGrid.map((day) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'border-b border-r min-h-[120px] p-1 transition-colors group',
                      !isCurrentMonth && 'bg-muted/30',
                      isCurrentDay && 'bg-primary/5 ring-2 ring-primary/20 ring-inset'
                    )}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day)}
                  >
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span
                        className={cn(
                          'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                          isCurrentDay && 'bg-primary text-primary-foreground',
                          !isCurrentMonth && 'text-muted-foreground',
                          day.getDay() === 0 && 'text-red-600',
                          day.getDay() === 6 && 'text-blue-600'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {onCreateEvent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                          onClick={() => onCreateEvent(day)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          draggable
                          onDragStart={() => handleDragStart(event)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onEventClick(event)}
                          className={cn(
                            'text-xs p-1 rounded cursor-pointer truncate flex items-center gap-1',
                            EVENT_TYPE_CONFIG[event.type].bgColor,
                            EVENT_TYPE_CONFIG[event.type].textColor,
                            'hover:opacity-80 transition-opacity',
                            draggedEvent?.id === event.id && 'opacity-50'
                          )}
                        >
                          {onEventDrop && (
                            <GripVertical className="h-3 w-3 shrink-0 cursor-grab" />
                          )}
                          <span className="truncate">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          +{dayEvents.length - 3} 更多
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Week View */}
      {viewType === 'week' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-8 border-b bg-muted/30 shrink-0">
            <div className="py-3 px-2 text-center text-sm font-medium text-muted-foreground">
              时间
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  'py-3 text-center',
                  isToday(day) && 'bg-primary/5'
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE', { locale: zhCN })}
                </div>
                <div
                  className={cn(
                    'text-lg font-semibold',
                    isToday(day) && 'text-primary',
                    day.getDay() === 0 && 'text-red-600',
                    day.getDay() === 6 && 'text-blue-600'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-8">
              {HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="h-16 border-b border-r py-1 px-2 text-xs text-muted-foreground text-right">
                    {hour === 0 ? '' : `${hour}:00`}
                  </div>

                  {weekDays.map((day) => {
                    const dayEvents = getEventsForDate(day).filter((event) => {
                      const eventStart = parseISO(event.startDate);
                      return eventStart.getHours() === hour;
                    });

                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className={cn(
                          'h-16 border-b border-r relative',
                          isToday(day) && 'bg-primary/5'
                        )}
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                          const targetDate = new Date(day);
                          targetDate.setHours(hour);
                          handleDrop(e, targetDate);
                        }}
                      >
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={() => handleDragStart(event)}
                            onDragEnd={handleDragEnd}
                            onClick={() => onEventClick(event)}
                            className={cn(
                              'absolute left-0 right-0 mx-0.5 p-1 rounded text-xs cursor-pointer z-10',
                              EVENT_TYPE_CONFIG[event.type].bgColor,
                              EVENT_TYPE_CONFIG[event.type].textColor,
                              'hover:opacity-80 transition-opacity'
                            )}
                            style={{
                              height: 'calc(100% - 4px)',
                              top: '2px',
                            }}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {event.customerName && (
                              <div className="truncate text-muted-foreground">
                                {event.customerName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-3 border-t bg-muted/30">
        {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded', config.color)} />
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
