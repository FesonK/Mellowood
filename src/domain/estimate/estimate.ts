import { MASTERED } from '@/domain/graph/algorithms';
import type { ConceptGraph, MasteryMap } from '@/domain/graph/types';
import { clamp01 } from '@/lib/math';

export interface TimeEstimate {
  remainingHours: number;
  /** null when weekly hours are unknown or zero. */
  weeks: number | null;
}

/** Remaining hours = Σ hours × (1 − mastery), skipping mastered concepts; weeks rounded up. */
export function estimateTimeToLearn(graph: ConceptGraph, mastery: MasteryMap, weeklyHours: number): TimeEstimate {
  const remaining = graph.concepts.reduce((sum, c) => {
    const m = clamp01(mastery[c.id] ?? 0);
    return m >= MASTERED ? sum : sum + c.hours * (1 - m);
  }, 0);
  const remainingHours = Math.round(remaining * 10) / 10;
  const weeks = weeklyHours > 0 ? Math.ceil(remainingHours / weeklyHours) : null;
  return { remainingHours, weeks };
}

export function formatEstimate({ remainingHours, weeks }: TimeEstimate, weeklyHours: number): string {
  if (remainingHours <= 0) return 'you already know it all!';
  if (weeks === null) return `about ${Math.ceil(remainingHours)} hours of focused learning`;
  return `about ${weeks} week${weeks === 1 ? '' : 's'} at ${weeklyHours} h/week`;
}
