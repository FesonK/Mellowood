import type { ConceptGraph, MasteryMap } from './types';

/** Mastery at or above this counts as "mastered" for unlocking and skipping. */
export const MASTERED = 0.8;

export const isMastered = (mastery: MasteryMap, id: string) => (mastery[id] ?? 0) >= MASTERED;

/**
 * Kahn's algorithm processed in waves: each wave holds the concepts whose prerequisites were all
 * in earlier waves, so wave index == longest prerequisite chain. Within a wave, original order is
 * kept, which makes output deterministic. Prerequisites that don't exist are ignored here
 * (validateGraph reports them). Concepts stuck in a cycle are omitted.
 */
export function depthLayers(graph: ConceptGraph): string[][] {
  const ids = new Set(graph.concepts.map((c) => c.id));
  const remaining = new Map(
    graph.concepts.map((c) => [c.id, new Set(c.prerequisites.filter((p) => ids.has(p) && p !== c.id))]),
  );
  const selfLoops = new Set(graph.concepts.filter((c) => c.prerequisites.includes(c.id)).map((c) => c.id));
  const layers: string[][] = [];

  while (remaining.size > 0) {
    const wave = graph.concepts
      .map((c) => c.id)
      .filter((id) => remaining.has(id) && !selfLoops.has(id) && remaining.get(id)!.size === 0);
    if (wave.length === 0) break; // cycle
    for (const id of wave) {
      remaining.delete(id);
    }
    for (const prereqs of remaining.values()) for (const id of wave) prereqs.delete(id);
    layers.push(wave);
  }
  return layers;
}

export const topoSort = (graph: ConceptGraph): string[] => depthLayers(graph).flat();

export function ancestors(graph: ConceptGraph, id: string): Set<string> {
  const byId = new Map(graph.concepts.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const stack = [...(byId.get(id)?.prerequisites ?? [])];
  while (stack.length) {
    const next = stack.pop()!;
    if (seen.has(next) || next === id) continue;
    seen.add(next);
    stack.push(...(byId.get(next)?.prerequisites ?? []));
  }
  return seen;
}

export const dependents = (graph: ConceptGraph, id: string): string[] =>
  graph.concepts.filter((c) => c.prerequisites.includes(id)).map((c) => c.id);

export function descendants(graph: ConceptGraph, id: string): Set<string> {
  const seen = new Set<string>();
  const stack = dependents(graph, id);
  while (stack.length) {
    const next = stack.pop()!;
    if (seen.has(next) || next === id) continue;
    seen.add(next);
    stack.push(...dependents(graph, next));
  }
  return seen;
}

/** Unmastered concepts that can be learned right now, in topological order. */
export function frontier(graph: ConceptGraph, mastery: MasteryMap): string[] {
  const byId = new Map(graph.concepts.map((c) => [c.id, c]));
  return topoSort(graph).filter(
    (id) => !isMastered(mastery, id) && byId.get(id)!.prerequisites.every((p) => isMastered(mastery, p)),
  );
}

/** Concepts nothing depends on: the end goals of the graph. */
export function goalConcepts(graph: ConceptGraph): string[] {
  const required = new Set(graph.concepts.flatMap((c) => c.prerequisites));
  return topoSort(graph).filter((id) => !required.has(id));
}

export const conceptById = (graph: ConceptGraph, id: string) => graph.concepts.find((c) => c.id === id);
