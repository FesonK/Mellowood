import type { ChatMessage } from '@/ai/types';
import type { Repository } from '@/data/types';

export interface GoalDraft {
  id: 'current';
  messages: ChatMessage[];
  updatedAt: string;
}

const COLLECTION = 'drafts';
const ID = 'current';

export async function saveDraft(repo: Repository, userId: string, messages: ChatMessage[]) {
  if (!messages.length) return;
  const draft: GoalDraft = { id: ID, messages, updatedAt: new Date().toISOString() };
  await repo.put(userId, COLLECTION, draft);
}

export const loadDraft = (repo: Repository, userId: string) => repo.get<GoalDraft>(userId, COLLECTION, ID);

export const clearDraft = (repo: Repository, userId: string) => repo.remove(userId, COLLECTION, ID);

/** A short human preview of the draft: the learner's first message. */
export const draftPreview = (draft: GoalDraft) => draft.messages.find((m) => m.role === 'user')?.content ?? '';
