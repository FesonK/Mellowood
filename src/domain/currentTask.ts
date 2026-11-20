import type { TaskContent } from '@/ai/types';
import type { Repository } from '@/data/types';
import type { TaskPlan } from '@/domain/strategy/strategy';

/** The task currently handed to the learner for a goal; kept stable until it's completed. */
export interface CurrentTask {
  id: string;
  goalId: string;
  plan: TaskPlan;
  content: TaskContent;
  createdAt: string;
}

const COLLECTION = 'tasks';

export const loadCurrentTask = (repo: Repository, userId: string, goalId: string) =>
  repo.get<CurrentTask>(userId, COLLECTION, goalId);

export const saveCurrentTask = (repo: Repository, userId: string, task: CurrentTask) =>
  repo.put(userId, COLLECTION, task);

export const clearCurrentTask = (repo: Repository, userId: string, goalId: string) =>
  repo.remove(userId, COLLECTION, goalId);
