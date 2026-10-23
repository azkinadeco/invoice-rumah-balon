'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarDay {
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  eventCount: number;
}

interface ScheduleCalendarViewProps {
  viewYear: number;
  viewMonth: number;
  monthName: string;
  calendarGrid: CalendarDay[];
  selectedCalendarDate: string | null;
  onSelectDate: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetToday: () => void;
  todayStr: string;
}

const DAYS_HEADER_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  viewYear,
  viewMonth,
  monthName,
  calendarGrid,
  selectedCalendarDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onResetToday,
  todayStr,
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4 animate-in fade-in">
      {/* Month Navigator Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#f370a8]" />
          <h2 className="text-base font-black text-foreground tracking-tight">
            Kalender {monthName} {viewYear}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onPrevMonth}
            aria-label="Bulan sebelumnya"
            className="h-8 w-8 rounded-xl hover:bg-muted text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetToday}
            aria-label="Kembali ke bulan dan hari ini"
            className="h-8 px-2.5 rounded-xl border-border text-foreground hover:bg-muted text-xs font-bold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3 text-[#f370a8]" />
            <span>Hari Ini</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNextMonth}
            aria-label="Bulan berikutnya"
            className="h-8 w-8 rounded-xl hover:bg-muted text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAYS_HEADER_ID.map((d, idx) => (
          <div
            key={d}
            className={cn(
              'text-[11px] font-bold py-1 uppercase tracking-wider',
              idx >= 5 ? 'text-[#f370a8]' : 'text-muted-foreground'
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {calendarGrid.map((day) => {
          const isSelected = selectedCalendarDate === day.dateStr;
          const hasEvents = day.eventCount > 0;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onSelectDate(day.dateStr)}
              className={cn(
                'min-h-[52px] sm:min-h-[64px] p-1.5 rounded-2xl flex flex-col items-center justify-between transition-all cursor-pointer border text-center relative group',
                !day.isCurrentMonth && 'opacity-40 bg-muted/20 border-transparent',
                day.isCurrentMonth && !isSelected && day.eventCount >= 3 && 'bg-rose-500/5 border-rose-300 dark:border-rose-900',
                day.isCurrentMonth && !isSelected && day.eventCount < 3 && 'bg-card hover:bg-muted/60 border-border/80',
                day.isToday && !isSelected && 'border-[#f370a8]/60 bg-[#f370a8]/10 ring-1 ring-[#f370a8]/40',
                isSelected && 'bg-gradient-to-br from-[#f370a8] to-[#4d3085] text-white border-transparent shadow-md shadow-[#f370a8]/25 scale-[1.02] z-10'
              )}
            >
              <span
                className={cn(
                  'text-xs font-mono font-bold',
                  isSelected ? 'text-white' : day.isToday ? 'text-[#f370a8]' : 'text-foreground'
                )}
              >
                {day.dayNum}
              </span>

              {hasEvents ? (
                <div className="flex items-center gap-0.5 mt-1">
                  <span
                    className={cn(
                      'text-[9px] font-black px-1.5 py-0.2 rounded-full font-mono',
                      isSelected
                        ? 'bg-white text-[#4d3085]'
                        : day.eventCount >= 3
                        ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                        : 'bg-[#f370a8] text-white shadow-2xs'
                    )}
                    title={day.eventCount >= 3 ? `${day.eventCount} acara (Jadwal Padat Peak!)` : `${day.eventCount} acara`}
                  >
                    {day.eventCount}
                  </span>
                </div>
              ) : (
                <span className="w-1 h-1 rounded-full bg-transparent mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
