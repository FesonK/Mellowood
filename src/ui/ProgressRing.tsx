import { useId } from 'react';
import { clamp01 } from '@/lib/math';

export interface ProgressRingProps {
  value: number;
  label: string;
  size?: number;
  stroke?: number;
  showValue?: boolean;
}

export function ProgressRing({ value, label, size = 64, stroke = 8, showValue = true }: ProgressRingProps) {
  const gradientId = useId();
  const v = clamp01(value);
  const pct = Math.round(v * 100);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--berry))" />
            <stop offset="100%" stopColor="rgb(var(--lavender))" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--lavender) / 0.25)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {showValue && <span className="absolute font-display text-sm font-semibold">{pct}%</span>}
    </div>
  );
}
