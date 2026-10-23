'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

interface ScheduleStatsProps {
  stats: {
    monthTotal: number;
    today: number;
    tomorrow: number;
    inProgress: number;
    totalAll: number;
  };
  currentMonthName: string;
  onFilterToday?: () => void;
  onFilterTomorrow?: () => void;
  onFilterAll?: () => void;
  activeQuickDate?: 'all' | 'today' | 'tomorrow';
}

export const ScheduleStats: React.FC<ScheduleStatsProps> = ({
  stats,
  currentMonthName,
  onFilterToday,
  onFilterTomorrow,
  onFilterAll,
  activeQuickDate = 'all',
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Acara Bulan Ini */}
      <Card
        onClick={onFilterAll}
        className={`rounded-2xl border bg-card shadow-2xs transition-all cursor-pointer hover:border-[#4d3085]/50 ${
          activeQuickDate === 'all' ? 'border-[#4d3085] ring-2 ring-[#4d3085]/20' : 'border-border/80'
        }`}
        title="Klik untuk melihat semua acara bulan ini"
      >
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Bulan {currentMonthName}
            </p>
            <p className="text-xl sm:text-2xl font-black text-foreground font-mono mt-0.5">
              {stats.monthTotal}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#4d3085]/15 flex items-center justify-center text-[#4d3085] dark:text-[#c4b5fd]">
            <Calendar className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Acara Hari Ini (H-Day Focus) */}
      <Card
        onClick={onFilterToday}
        className={`rounded-2xl border bg-card shadow-2xs transition-all cursor-pointer hover:border-[#f370a8] ${
          activeQuickDate === 'today'
            ? 'border-[#f370a8] ring-2 ring-[#f370a8]/30 bg-[#f370a8]/5'
            : 'border-border/80'
        }`}
        title="Klik untuk filter khusus acara Hari Ini"
      >
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Hari Ini
              </p>
              {stats.today > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#f370a8] animate-pulse" />
              )}
            </div>
            <p className="text-xl sm:text-2xl font-black text-[#f370a8] font-mono mt-0.5">
              {stats.today}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#f370a8]/15 flex items-center justify-center text-[#f370a8]">
            <Sparkles className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Acara Besok */}
      <Card
        onClick={onFilterTomorrow}
        className={`rounded-2xl border bg-card shadow-2xs transition-all cursor-pointer hover:border-[#4d3085] ${
          activeQuickDate === 'tomorrow'
            ? 'border-[#4d3085] ring-2 ring-[#4d3085]/30 bg-[#4d3085]/5'
            : 'border-border/80'
        }`}
        title="Klik untuk filter khusus acara Besok"
      >
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Besok
            </p>
            <p className="text-xl sm:text-2xl font-black text-foreground font-mono mt-0.5">
              {stats.tomorrow}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#4d3085]/15 flex items-center justify-center text-[#4d3085] dark:text-[#c4b5fd]">
            <Clock className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Sedang Pengerjaan */}
      <Card className="rounded-2xl border border-border/80 bg-card shadow-2xs">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Pengerjaan / Siap
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {stats.inProgress}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
