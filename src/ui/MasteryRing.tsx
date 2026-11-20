import { MASTERED } from '@/domain/graph/algorithms';
import { ProgressRing } from './ProgressRing';

export function MasteryRing({ value, label, size = 64 }: { value: number; label: string; size?: number }) {
  return (
    <span className="relative inline-grid">
      <ProgressRing value={value} label={`${label} mastery`} size={size} />
      {value >= MASTERED && (
        <span role="img" aria-label="Mastered!" className="absolute -right-1 -top-1 animate-wiggle text-lg">
          ✨
        </span>
      )}
    </span>
  );
}
