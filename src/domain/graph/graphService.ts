import type { AIProvider, GoalSummary } from '@/ai/types';
import type { ConceptGraph } from './types';
import { validateGraph } from './validate';

export class GraphGenerationError extends Error {
  constructor() {
    super("Mellow couldn't map out this goal just now. Let's try again in a moment!");
    this.name = 'GraphGenerationError';
  }
}

/** Fix the cheap, unambiguous mistakes models make: duplicates, self-loops, unknown prerequisites. */
export function repairGraph(graph: ConceptGraph): ConceptGraph {
  const seen = new Set<string>();
  const unique = graph.concepts.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  return {
    ...graph,
    concepts: unique.map((c) => ({
      ...c,
      prerequisites: [...new Set(c.prerequisites)].filter((p) => p !== c.id && seen.has(p)),
    })),
  };
}

/** Ask the provider for a graph; repair, validate, and retry once before giving up. */
export async function generateValidGraph(ai: AIProvider, summary: GoalSummary, attempts = 2): Promise<ConceptGraph> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const raw = await ai.generateGraph(summary);
      if (validateGraph(raw).ok) return raw;
      const repaired = repairGraph(raw);
      if (validateGraph(repaired).ok) return repaired;
    } catch {
      // fall through to retry
    }
  }
  throw new GraphGenerationError();
}
