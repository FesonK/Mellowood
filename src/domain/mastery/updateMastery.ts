import { clamp01 } from '@/lib/math';

export type SelfAssessment = 'nailed' | 'mostly' | 'struggled';

/** Where each self-assessed outcome pulls mastery toward. */
export const OUTCOME_TARGET: Record<SelfAssessment, number> = {
  nailed: 1,
  mostly: 0.75,
  struggled: 0.4,
};

export const LEARNING_RATE = 0.5;

/**
 * Phase-1 rule (MEL-49): an exponential moving average toward the outcome's target,
 * m' = m + (target − m) × rate. Phase 2 (MEL-59) replaces this with reviewed evidence.
 */
export function updateMastery(current: number, outcome: SelfAssessment, rate = LEARNING_RATE): number {
  const m = clamp01(current);
  return clamp01(m + (OUTCOME_TARGET[outcome] - m) * rate);
}
