import type { GoalSummary } from '@/ai/types';
import type { ConceptGraph } from './types';

export const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export const normalizeGoalKey = (summary: Pick<GoalSummary, 'endGoal' | 'domain'>) =>
  `${norm(summary.domain)}::${norm(summary.endGoal)}`;

interface Entry {
  graph: ConceptGraph;
  storedAt: number;
}

/**
 * Device-local cache so common goals open instantly. (The `ai` edge function also keeps a shared
 * server-side cache in the graph_cache table.)
 */
export interface GraphCacheOptions {
  now?: () => number;
  ttlMs?: number;
  prefix?: string;
}

export class GraphCache {
  private readonly now: () => number;
  private readonly ttlMs: number;
  private readonly prefix: string;

  constructor(
    private readonly storage: Storage,
    { now = Date.now, ttlMs = DEFAULT_TTL_MS, prefix = 'mellowood:graph-cache:' }: GraphCacheOptions = {},
  ) {
    this.now = now;
    this.ttlMs = ttlMs;
    this.prefix = prefix;
  }

  peek(summary: GoalSummary): ConceptGraph | null {
    const key = this.prefix + normalizeGoalKey(summary);
    try {
      const entry = JSON.parse(this.storage.getItem(key) ?? 'null') as Entry | null;
      if (!entry) return null;
      if (this.now() - entry.storedAt > this.ttlMs) {
        this.storage.removeItem(key);
        return null;
      }
      return entry.graph;
    } catch {
      return null;
    }
  }

  async getOrCreate(summary: GoalSummary, generate: () => Promise<ConceptGraph>): Promise<ConceptGraph> {
    const hit = this.peek(summary);
    if (hit) return hit;
    const graph = await generate();
    const entry: Entry = { graph, storedAt: this.now() };
    try {
      this.storage.setItem(this.prefix + normalizeGoalKey(summary), JSON.stringify(entry));
    } catch {
      // storage full: caching is best-effort
    }
    return graph;
  }
}
