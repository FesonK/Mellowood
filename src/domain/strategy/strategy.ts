import { descendants, frontier, isMastered } from '@/domain/graph/algorithms';
import type { ConceptGraph, MasteryMap } from '@/domain/graph/types';
import { clamp } from '@/lib/math';

export const FRAMINGS = ['build', 'investigate', 'fix', 'challenge'] as const;
export type Framing = (typeof FRAMINGS)[number];

export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 5;

export interface Preferences {
  /** > 0 leans to building things, < 0 leans to reading and investigating. */
  handsOn: number;
  /** > 0 wants harder work, < 0 wants gentler work. */
  challenge: number;
}

export interface OutcomeSignal {
  conceptId: string;
  kind: 'struggle' | 'ok' | 'easy';
}

export interface ChangelogEntry {
  at: string;
  message: string;
}

/** Everything the strategy knows. Pure data: every function here returns a new state. */
export interface StrategyState {
  goalId: string;
  graph: ConceptGraph;
  mastery: MasteryMap;
  difficulty: number;
  framingIndex: number;
  lastFraming?: Framing;
  remediation: string[];
  recent: OutcomeSignal[];
  preferences: Preferences;
  changelog: ChangelogEntry[];
}

export interface TaskPlan {
  conceptId: string;
  difficulty: number;
  framing: Framing;
  reason: 'next' | 'revisit';
}

export function createStrategy(goalId: string, graph: ConceptGraph, mastery: MasteryMap): StrategyState {
  return {
    goalId,
    graph,
    mastery,
    difficulty: 2,
    framingIndex: 0,
    remediation: [],
    recent: [],
    preferences: { handsOn: 0, challenge: 0 },
    changelog: [],
  };
}

/** Framing cycles; hands-on learners get more building, readers more investigating. No back-to-back repeats. */
function framingCycle(prefs: Preferences): Framing[] {
  if (prefs.handsOn > 0) return ['build', 'fix', 'build', 'challenge'];
  if (prefs.handsOn < 0) return ['investigate', 'build', 'investigate', 'challenge'];
  return [...FRAMINGS];
}

function pickFraming(state: StrategyState): Framing {
  const cycle = framingCycle(state.preferences);
  for (let i = 0; i < cycle.length; i++) {
    const f = cycle[(state.framingIndex + i) % cycle.length];
    if (f !== state.lastFraming) return f;
  }
  return cycle[0];
}

export function nextTask(state: StrategyState): TaskPlan | null {
  const { graph, mastery } = state;
  const revisit = state.remediation.find((id) => !isMastered(mastery, id));

  let conceptId: string | undefined = revisit;
  if (!conceptId) {
    const candidates = frontier(graph, mastery);
    let best = -1;
    for (const id of candidates) {
      const unlocks = descendants(graph, id).size;
      if (unlocks > best) {
        best = unlocks;
        conceptId = id;
      }
    }
  }
  if (!conceptId) return null;

  const m = mastery[conceptId] ?? 0;
  const bump = (m >= 0.5 ? 1 : 0) + Math.sign(state.preferences.challenge);
  return {
    conceptId,
    difficulty: clamp(state.difficulty + bump, MIN_DIFFICULTY, MAX_DIFFICULTY),
    framing: pickFraming(state),
    reason: revisit ? 'revisit' : 'next',
  };
}

/** Record that a plan was handed out, so the next framing rotates. */
export function advance(state: StrategyState, plan: TaskPlan): StrategyState {
  const cycle = framingCycle(state.preferences);
  // Search forward from the current position (cycles may repeat a framing, so indexOf is wrong).
  let step = 0;
  while (step < cycle.length && cycle[(state.framingIndex + step) % cycle.length] !== plan.framing) step++;
  return { ...state, framingIndex: state.framingIndex + step + 1, lastFraming: plan.framing };
}
