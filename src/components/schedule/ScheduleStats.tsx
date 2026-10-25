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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. Total Acara Bulan Ini */}
      <Card
        onClick={onFilterAll}
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border bg-card/90 backdrop-blur-xl shadow-xs transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg group ${
          activeQuickDate === 'all'
            ? 'border-[#4d3085] ring-2 ring-[#4d3085]/30'
            : 'border-border/80 hover:border-[#4d3085]/40'
        }`}
        title="Klik untuk melihat semua acara bulan ini"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#4d3085] opacity-80" />
        <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">
              Bulan {currentMonthName}
            </p>
            <p className="text-xl sm:text-3xl font-black text-foreground font-mono tracking-tight">
              {stats.monthTotal}
            </p>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">
              Total acara terjadwal
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#4d3085] text-white flex items-center justify-center shadow-md shadow-[#4d3085]/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Acara Hari Ini (H-Day Focus) */}
      <Card
        onClick={onFilterToday}
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border bg-card/90 backdrop-blur-xl shadow-xs transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg group ${
          activeQuickDate === 'today'
            ? 'border-[#f370a8] ring-2 ring-[#f370a8]/40 bg-[#f370a8]/5'
            : 'border-border/80 hover:border-[#f370a8]/40'
        }`}
        title="Klik untuk filter khusus acara Hari Ini"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#f370a8] opacity-90" />
        <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Hari Ini
              </p>
              {stats.today > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#f370a8] animate-ping" />
              )}
            </div>
            <p className="text-xl sm:text-3xl font-black text-[#f370a8] dark:text-[#f472b6] font-mono tracking-tight">
              {stats.today}
            </p>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">
              Perlu eksekusi & setup
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#f370a8] text-white flex items-center justify-center shadow-md shadow-[#f370a8]/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Acara Besok */}
      <Card
        onClick={onFilterTomorrow}
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border bg-card/90 backdrop-blur-xl shadow-xs transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg group ${
          activeQuickDate === 'tomorrow'
            ? 'border-[#4d3085] ring-2 ring-[#4d3085]/40 bg-[#4d3085]/5'
            : 'border-border/80 hover:border-[#4d3085]/40'
        }`}
        title="Klik untuk filter khusus acara Besok"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4d3085] to-[#f370a8] opacity-90" />
        <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Besok
            </p>
            <p className="text-xl sm:text-3xl font-black text-foreground font-mono tracking-tight">
              {stats.tomorrow}
            </p>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">
              Persiapan properti & balon
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#4d3085] text-white flex items-center justify-center shadow-md shadow-[#4d3085]/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Sedang Pengerjaan */}
      <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 opacity-90" />
        <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Pengerjaan / Siap
            </p>
            <p className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              {stats.inProgress}
            </p>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium block truncate">
              Proses dekor berjalan
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
