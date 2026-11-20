import type { Repository } from '@/data/types';
import { randomId } from '@/auth/mockAuth';
import { MASTERED } from './graph/algorithms';
import type { Goal } from './goal';
import { clearCurrentTask, type CurrentTask } from './currentTask';
import { loadMastery, saveMastery } from './mastery/masteryStore';
import { updateMastery, type SelfAssessment } from './mastery/updateMastery';
import { recordOutcome } from './strategy/pace';
import { applyReflection, type Reflection } from './strategy/reflection';
import { createStrategy } from './strategy/strategy';
import { loadStrategy, saveStrategy } from './strategy/strategyStore';
import { refreshTrack, type Track } from './track/track';

export interface TaskReflection extends Reflection {
  outcome: SelfAssessment;
}

export interface CompletionResult {
  conceptId: string;
  masteryBefore: number;
  masteryAfter: number;
  mastered: boolean;
}

/**
 * Close the loop on a task: grow mastery from the self-assessment, let the reflection and the
 * outcome steer the strategy, refresh the track, keep the reflection, and free up the next task.
 */
export async function completeTask(
  repo: Repository,
  userId: string,
  goal: Goal,
  task: CurrentTask,
  reflection: TaskReflection,
): Promise<CompletionResult> {
  const graph = goal.graph!;
  const conceptId = task.plan.conceptId;

  const mastery = await loadMastery(repo, userId);
  const masteryBefore = mastery[conceptId] ?? 0;
  const masteryAfter = updateMastery(masteryBefore, reflection.outcome);
  const nextMastery = { ...mastery, [conceptId]: masteryAfter };
  await saveMastery(repo, userId, { [conceptId]: masteryAfter });

  let strategy = (await loadStrategy(repo, userId, goal.id, graph, nextMastery)) ?? createStrategy(goal.id, graph, nextMastery);
  strategy = applyReflection(strategy, reflection);
  strategy = recordOutcome(strategy, { conceptId, masteryGain: masteryAfter - masteryBefore });
  await saveStrategy(repo, userId, strategy);

  const track = await repo.get<Track>(userId, 'tracks', goal.id);
  if (track) await repo.put(userId, 'tracks', refreshTrack(track, graph, nextMastery));

  await repo.put(userId, 'reflections', {
    id: randomId(),
    goalId: goal.id,
    conceptId,
    ...reflection,
    masteryBefore,
    masteryAfter,
    createdAt: new Date().toISOString(),
  });
  await clearCurrentTask(repo, userId, goal.id);

  return { conceptId, masteryBefore, masteryAfter, mastered: masteryAfter >= MASTERED };
}
