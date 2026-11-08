'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatRupiah } from '@/lib/format';
import { MonthSummary, monthLabel } from '@/lib/reports';

// Validated (dataviz validate_palette.js) brand-adjacent pair:
// light #6b46c1 / #db2777 on light surface, dark #8b6be0 / #e0468f on dark surface.
const RECEIVED = 'fill-[#6b46c1] dark:fill-[#8b6be0]';
const OUTSTANDING = 'fill-[#db2777] dark:fill-[#e0468f]';
const RECEIVED_BG = 'bg-[#6b46c1] dark:bg-[#8b6be0]';
const OUTSTANDING_BG = 'bg-[#db2777] dark:bg-[#e0468f]';

/** "12,5 jt" / "800 rb" for axis ticks. */
function compactRupiah(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} rb`;
  return String(n);
}

/** Round the axis max up to a friendly step so gridlines land on clean numbers. */
function niceMax(v: number): number {
  if (v <= 0) return 1_000_000;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s * pow >= v) ?? 10;
  return step * pow;
}

/** Rect with only the top corners rounded (data end), flat on the baseline. */
function topRoundedRect(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

interface Props {
  months: MonthSummary[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function MonthlyTrendChart({ months, selectedKey, onSelect }: Props) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  // Draw at the real pixel width so text stays its normal size on any screen
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(600);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 240;
  const PAD = { top: 12, right: 8, bottom: 26, left: 44 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(...months.map((m) => m.revenue)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const slot = plotW / months.length;
  const barW = Math.min(44, slot * 0.55);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

  const hovered = months.find((m) => m.key === hoverKey);
  const hoveredIndex = hovered ? months.indexOf(hovered) : -1;

  return (
    <div>
      {/* Legend (2 series → always shown) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground mb-2">
        <span className="inline-flex items-center gap-1.5">
          <span className={cn('w-2.5 h-2.5 rounded-sm', RECEIVED_BG)} /> Sudah diterima
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={cn('w-2.5 h-2.5 rounded-sm', OUTSTANDING_BG)} /> Belum dibayar
        </span>
      </div>

      <div className="relative" ref={boxRef}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block max-w-full select-none"
          role="img"
          aria-label="Grafik omzet 6 bulan: sudah diterima dan belum dibayar per bulan"
          onMouseLeave={() => setHoverKey(null)}
        >
          {/* Recessive grid + y labels */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                className={t === 0 ? 'stroke-border' : 'stroke-border/50'}
                strokeWidth={1}
              />
              <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
                {t === 0 ? '0' : compactRupiah(t)}
              </text>
            </g>
          ))}

          {months.map((m, i) => {
            const cx = PAD.left + slot * i + slot / 2;
            const x = cx - barW / 2;
            const selected = m.key === selectedKey;
            const dim = (hoverKey && hoverKey !== m.key) || (!hoverKey && !selected);
            const recH = (m.received / max) * plotH;
            const outH = (m.outstanding / max) * plotH;
            const gap = recH > 0 && outH > 0 ? 2 : 0; // 2px surface gap between stacked fills
            const outTop = y(m.received + m.outstanding);
            return (
              <g key={m.key} className="transition-opacity" opacity={dim ? 0.55 : 1}>
                {recH > 0 && (
                  <path
                    d={outH > 0 ? `M${x},${y(0)} H${x + barW} V${y(m.received)} H${x} Z` : topRoundedRect(x, y(m.received), barW, recH, 4)}
                    className={RECEIVED}
                  />
                )}
                {outH > 0 && (
                  <path d={topRoundedRect(x, outTop, barW, Math.max(0, outH - gap), 4)} className={OUTSTANDING} />
                )}
                <text
                  x={cx}
                  y={H - 8}
                  textAnchor="middle"
                  className={cn('text-[11px]', selected ? 'fill-foreground font-bold' : 'fill-muted-foreground')}
                >
                  {monthLabel(m.key, true)}
                </text>
                {/* Hit target: whole column, bigger than the mark */}
                <rect
                  x={PAD.left + slot * i}
                  y={PAD.top}
                  width={slot}
                  height={plotH + PAD.bottom}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverKey(m.key)}
                  onFocus={() => setHoverKey(m.key)}
                  onBlur={() => setHoverKey(null)}
                  onClick={() => onSelect(m.key)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${monthLabel(m.key)}: omzet ${formatRupiah(m.revenue)}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelect(m.key);
                  }}
                />
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-xl border border-border bg-card px-3 py-2 text-[11px] shadow-lg"
            style={{
              left: `${Math.min(80, Math.max(20, ((PAD.left + slot * hoveredIndex + slot / 2) / W) * 100))}%`,
            }}
          >
            <div className="font-bold text-foreground mb-1">{monthLabel(hovered.key)}</div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>Omzet</span>
              <span className="font-semibold text-foreground tabular-nums">{formatRupiah(hovered.revenue)}</span>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className={cn('w-2 h-2 rounded-sm', RECEIVED_BG)} /> Diterima
              </span>
              <span className="text-foreground tabular-nums">{formatRupiah(hovered.received)}</span>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className={cn('w-2 h-2 rounded-sm', OUTSTANDING_BG)} /> Belum
              </span>
              <span className="text-foreground tabular-nums">{formatRupiah(hovered.outstanding)}</span>
            </div>
            <div className="mt-1 text-muted-foreground">{hovered.eventCount} acara</div>
          </div>
        )}
      </div>

      {/* Table view for screen readers */}
      <table className="sr-only">
        <caption>Omzet per bulan</caption>
        <thead>
          <tr>
            <th>Bulan</th>
            <th>Omzet</th>
            <th>Sudah diterima</th>
            <th>Belum dibayar</th>
            <th>Jumlah acara</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.key}>
              <td>{monthLabel(m.key)}</td>
              <td>{formatRupiah(m.revenue)}</td>
              <td>{formatRupiah(m.received)}</td>
              <td>{formatRupiah(m.outstanding)}</td>
              <td>{m.eventCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
