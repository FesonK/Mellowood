import { ancestors } from '@/domain/graph/algorithms';
import { clamp } from '@/lib/math';
import { MAX_DIFFICULTY, MIN_DIFFICULTY, type OutcomeSignal, type StrategyState } from './strategy';

export type Feedback = 'too-hard' | 'too-easy';

export interface TaskOutcome {
  conceptId: string;
  feedback?: Feedback;
  masteryGain?: number;
}

/** A prerequisite below this is considered weak enough to revisit. */
export const WEAK_PREREQUISITE = 0.6;

export function classifyOutcome({ feedback, masteryGain = 0.2 }: TaskOutcome): OutcomeSignal['kind'] {
  if (feedback === 'too-hard') return 'struggle';
  if (feedback === 'too-easy') return 'easy';
  if (masteryGain < 0.1) return 'struggle';
  if (masteryGain > 0.3) return 'easy';
  return 'ok';
}

function weakPrerequisite(state: StrategyState, conceptId: string): string | undefined {
  const concept = state.graph.concepts.find((c) => c.id === conceptId);
  const weak = (id: string) => (state.mastery[id] ?? 0) < WEAK_PREREQUISITE;
  return concept?.prerequisites.find(weak) ?? [...ancestors(state.graph, conceptId)].find(weak);
}

/**
 * Two struggles in a row: ease off and revisit a weak prerequisite.
 * Two easy wins in a row: raise the difficulty. Mixed signals change nothing.
 */
export function recordOutcome(state: StrategyState, outcome: TaskOutcome): StrategyState {
  const signal: OutcomeSignal = { conceptId: outcome.conceptId, kind: classifyOutcome(outcome) };
  const recent = [...state.recent, signal].slice(-2);
  const streak = recent.length === 2 && recent[0].kind === recent[1].kind ? recent[0].kind : null;
  const at = new Date().toISOString();

  if (streak === 'struggle') {
    const weak = weakPrerequisite(state, outcome.conceptId);
    const remediation = weak && !state.remediation.includes(weak) ? [...state.remediation, weak] : state.remediation;
    const name = state.graph.concepts.find((c) => c.id === weak)?.name;
    return {
      ...state,
      recent: [],
      difficulty: clamp(state.difficulty - 1, MIN_DIFFICULTY, MAX_DIFFICULTY),
      remediation,
      changelog: [
        ...state.changelog,
        { at, message: `That felt tough, so we'll slow down a little${name ? ` and revisit ${name} first` : ''}.` },
      ],
    };
  }

  if (streak === 'easy') {
    return {
      ...state,
      recent: [],
      difficulty: clamp(state.difficulty + 1, MIN_DIFFICULTY, MAX_DIFFICULTY),
      changelog: [...state.changelog, { at, message: "You're flying! We'll pick up the pace with meatier tasks." }],
    };
  }

  return { ...state, recent };
}
