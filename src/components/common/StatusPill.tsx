'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusPillProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  /** Badge colour classes (bg / text / border) for the current value. */
  badgeClassName?: string;
  ariaLabel: string;
  title?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Small status badge that opens the native picker when tapped.
 * The visible badge stays compact while the invisible <select> on top keeps a
 * 16px font so iOS Safari does not zoom in on tap.
 */
export const StatusPill: React.FC<StatusPillProps> = ({
  value,
  options,
  onChange,
  badgeClassName,
  ariaLabel,
  title,
  size = 'sm',
  className,
}) => {
  const current = options.find((o) => o.value === value)?.label ?? value;

  return (
    <span
      title={title}
      className={cn(
        'relative inline-flex items-center gap-1 rounded-full border font-bold whitespace-nowrap shrink-0 transition-colors focus-within:ring-2 focus-within:ring-ring/50',
        size === 'sm' ? 'h-6 pl-2.5 pr-1.5 text-[11px]' : 'h-8 pl-3 pr-2 text-xs',
        badgeClassName,
        className
      )}
    >
      <span>{current}</span>
      <ChevronDown className="w-3 h-3 opacity-60" aria-hidden />
      <select
        data-pill
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
};
