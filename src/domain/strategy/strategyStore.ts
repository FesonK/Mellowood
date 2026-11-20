import type { Repository } from '@/data/types';
import type { ConceptGraph, MasteryMap } from '@/domain/graph/types';
import type { StrategyState } from './strategy';

/** What we persist: the strategy without the graph and mastery, which live in their own stores. */
type StrategyDoc = Omit<StrategyState, 'graph' | 'mastery'> & { id: string };

const COLLECTION = 'strategy';

export async function saveStrategy(repo: Repository, userId: string, state: StrategyState) {
  const { graph: _graph, mastery: _mastery, ...rest } = state;
  await repo.put<StrategyDoc>(userId, COLLECTION, { ...rest, id: state.goalId });
}

export async function loadStrategy(
  repo: Repository,
  userId: string,
  goalId: string,
  graph: ConceptGraph,
  mastery: MasteryMap,
): Promise<StrategyState | null> {
  const doc = await repo.get<StrategyDoc>(userId, COLLECTION, goalId);
  if (!doc) return null;
  const { id: _id, ...rest } = doc;
  return { ...rest, graph, mastery };
}
