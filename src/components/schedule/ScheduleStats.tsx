'use client';

import React from 'react';
import { StatCard } from '@/components/common/StatCard';
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      <StatCard
        label={`Bulan ${currentMonthName}`}
        value={stats.monthTotal}
        icon={Calendar}
        tone="purple"
        active={activeQuickDate === 'all'}
        onClick={onFilterAll}
        title="Klik untuk melihat semua acara bulan ini"
      />
      <StatCard
        label="Hari Ini"
        value={stats.today}
        icon={Sparkles}
        tone="pink"
        pulse={stats.today > 0}
        active={activeQuickDate === 'today'}
        onClick={onFilterToday}
        title="Klik untuk filter khusus acara Hari Ini"
      />
      <StatCard
        label="Besok"
        value={stats.tomorrow}
        icon={Clock}
        tone="purple"
        active={activeQuickDate === 'tomorrow'}
        onClick={onFilterTomorrow}
        title="Klik untuk filter khusus acara Besok"
      />
      <StatCard
        label="Pengerjaan / Siap"
        value={stats.inProgress}
        icon={CheckCircle2}
        tone="emerald"
      />
    </div>
  );
};
