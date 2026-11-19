import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type BadgeTone = 'peach' | 'blush' | 'lavender' | 'sky' | 'mint' | 'butter' | 'tangerine';

const tones: Record<BadgeTone, string> = {
  peach: 'bg-peach/40',
  blush: 'bg-blush/50',
  lavender: 'bg-lavender/40',
  sky: 'bg-sky/50',
  mint: 'bg-mint/50',
  butter: 'bg-butter/60',
  tangerine: 'bg-tangerine/30',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'lavender', className, ...rest }: BadgeProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-ink',
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
