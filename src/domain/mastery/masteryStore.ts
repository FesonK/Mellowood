import type { Repository } from '@/data/types';
import type { MasteryMap } from '@/domain/graph/types';
import { clamp01 } from '@/lib/math';

/** One document per concept so mastery is shared across every goal the learner has. */
interface MasteryDoc {
  id: string;
  value: number;
  updatedAt: string;
}

const COLLECTION = 'mastery';

export async function loadMastery(repo: Repository, userId: string): Promise<MasteryMap> {
  const docs = await repo.list<MasteryDoc>(userId, COLLECTION);
  return Object.fromEntries(docs.map((d) => [d.id, d.value]));
}

export async function saveMastery(repo: Repository, userId: string, values: MasteryMap): Promise<void> {
  const updatedAt = new Date().toISOString();
  for (const [id, value] of Object.entries(values)) {
    await repo.put<MasteryDoc>(userId, COLLECTION, { id, value: clamp01(value), updatedAt });
  }
}
