import { ancestors, topoSort } from '@/domain/graph/algorithms';
import type { ConceptGraph, MasteryMap } from '@/domain/graph/types';

/** Starting mastery for a concept the learner says they already know. */
export const KNOWN_MASTERY = 0.8;

export interface PlacementState {
  graph: ConceptGraph;
  order: string[];
  /** Concepts order[0..lo) are known. */
  lo: number;
  /** Concepts order[hi..] are unknown. */
  hi: number;
  known: string[];
  asked: number;
}

/**
 * Binary search for the knowledge boundary along topological order: knowing a concept implies
 * knowing everything before it, so each answer halves the remaining range.
 * Asks at most ceil(log2(n + 1)) questions.
 */
export function createPlacement(graph: ConceptGraph): PlacementState {
  const order = topoSort(graph);
  return { graph, order, lo: 0, hi: order.length, known: [], asked: 0 };
}

export const isDone = (s: PlacementState) => s.lo >= s.hi;

export function nextQuestion(s: PlacementState): string | null {
  return isDone(s) ? null : s.order[Math.floor((s.lo + s.hi) / 2)];
}

export function answer(s: PlacementState, knows: boolean): PlacementState {
  const mid = Math.floor((s.lo + s.hi) / 2);
  if (isDone(s)) return s;
  return knows
    ? { ...s, lo: mid + 1, known: [...s.known, s.order[mid]], asked: s.asked + 1 }
    : { ...s, hi: mid, asked: s.asked + 1 };
}

/** Maximum number of questions for a graph, for progress display. */
export const maxQuestions = (s: PlacementState) => Math.ceil(Math.log2(s.order.length + 1));

/** "Start me from scratch": every concept in this goal starts at zero. */
export const fromScratch = (graph: ConceptGraph): MasteryMap =>
  Object.fromEntries(graph.concepts.map((c) => [c.id, 0]));

/** Redoing placement may reveal more knowledge, but never takes earned mastery away. */
export function mergePlacement(previous: MasteryMap, next: MasteryMap): MasteryMap {
  const merged: MasteryMap = { ...previous };
  for (const [id, v] of Object.entries(next)) merged[id] = Math.max(merged[id] ?? 0, v);
  return merged;
}

export function placementResult(s: PlacementState): MasteryMap {
  const known = new Set(s.order.slice(0, s.lo));
  for (const id of s.known) {
    known.add(id);
    ancestors(s.graph, id).forEach((a) => known.add(a));
  }
  return Object.fromEntries([...known].map((id) => [id, KNOWN_MASTERY]));
}
