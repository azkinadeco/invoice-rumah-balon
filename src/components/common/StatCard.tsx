'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'purple' | 'pink' | 'emerald' | 'rose' | 'neutral';

const TONES: Record<Tone, { icon: string; value: string; ring: string }> = {
  purple: {
    icon: 'bg-[#4d3085]/10 text-[#4d3085] dark:bg-[#4d3085]/30 dark:text-[#c4b5fd]',
    value: 'text-foreground',
    ring: 'ring-[#4d3085]/45 dark:ring-[#c4b5fd]/50',
  },
  pink: {
    icon: 'bg-[#f370a8]/12 text-[#d6458a] dark:bg-[#f370a8]/20 dark:text-[#f472b6]',
    value: 'text-[#d6458a] dark:text-[#f472b6]',
    ring: 'ring-[#f370a8]/55',
  },
  emerald: {
    icon: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/50',
  },
  rose: {
    icon: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
    value: 'text-rose-600 dark:text-rose-400',
    ring: 'ring-rose-500/50',
  },
  neutral: {
    icon: 'bg-muted text-muted-foreground',
    value: 'text-foreground',
    ring: 'ring-border',
  },
};

interface StatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  badge?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  /** Smaller value text, used for long currency values. */
  compactValue?: boolean;
  active?: boolean;
  pulse?: boolean;
  onClick?: () => void;
  title?: string;
}

/**
 * Compact KPI tile shared by the Invoice, Jadwal and Stok pages.
 * Renders as a <button> when clickable so it is keyboard accessible.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  badge,
  icon: Icon,
  tone = 'purple',
  compactValue = false,
  active = false,
  pulse = false,
  onClick,
  title,
}) => {
  const t = TONES[tone];
  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      {...(onClick ? { type: 'button' as const, onClick, 'aria-pressed': active } : {})}
      title={title}
      className={cn(
        'group relative w-full text-left rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs transition-all',
        onClick && 'cursor-pointer hover:border-foreground/15 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        active && cn('ring-2', t.ring)
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </span>
          {pulse && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />}
        </div>
        <span
          className={cn(
            'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0',
            t.icon
          )}
        >
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </span>
      </div>

      <div
        className={cn(
          'mt-1 font-extrabold tracking-tight tabular-nums truncate',
          compactValue ? 'text-base sm:text-xl' : 'text-xl sm:text-2xl',
          t.value
        )}
      >
        {value}
      </div>

      {(sub || badge) && (
        <div className="mt-1 flex items-center gap-1.5 min-w-0 text-[11px] text-muted-foreground">
          {badge && (
            <span className="shrink-0 px-1.5 py-px rounded-md bg-muted text-foreground/80 text-[10px] font-semibold">
              {badge}
            </span>
          )}
          {sub && <span className="truncate">{sub}</span>}
        </div>
      )}
    </Comp>
  );
};
