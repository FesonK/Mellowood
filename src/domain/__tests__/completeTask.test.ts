import { completeTask } from '../completeTask';
import { MemoryRepository } from '@/data/memoryRepository';
import { saveCurrentTask, loadCurrentTask, type CurrentTask } from '../currentTask';
import { loadMastery, saveMastery } from '../mastery/masteryStore';
import { createStrategy } from '../strategy/strategy';
import { loadStrategy, saveStrategy } from '../strategy/strategyStore';
import { buildTrack, type Track } from '../track/track';
import type { Goal } from '../goal';
import { robotGraph } from '../graph/__tests__/fixtures';

const goal: Goal = {
  id: 'g1',
  status: 'active',
  summary: { title: 'Robot', endGoal: 'Build a robot', domain: 'Robotics', constraints: [] },
  messages: [],
  createdAt: 'x',
  graph: robotGraph,
};
const task: CurrentTask = {
  id: 'g1',
  goalId: 'g1',
  plan: { conceptId: 'basics/variables', difficulty: 2, framing: 'build', reason: 'next' },
  content: { hook: 'h', story: 's', steps: ['a'], doneWhen: ['b'], hints: ['1', '2', '3'] },
  createdAt: 'x',
};

async function setup(startMastery = 0) {
  const repo = new MemoryRepository();
  await saveMastery(repo, 'u1', { 'basics/variables': startMastery });
  await saveStrategy(repo, 'u1', createStrategy('g1', robotGraph, {}));
  await repo.put('u1', 'tracks', buildTrack('g1', robotGraph, {}));
  await saveCurrentTask(repo, 'u1', task);
  return repo;
}

describe('completeTask', () => {
  it('raises mastery, applies the reflection, clears the task and saves the reflection', async () => {
    const repo = await setup();
    const result = await completeTask(repo, 'u1', goal, task, {
      outcome: 'nailed',
      chips: ['more-hands-on'],
      liked: 'Wiring things',
      disliked: '',
      strategyChange: '',
    });
    expect(result.masteryBefore).toBe(0);
    expect(result.masteryAfter).toBe(0.5);
    expect((await loadMastery(repo, 'u1'))['basics/variables']).toBe(0.5);
    const strategy = await loadStrategy(repo, 'u1', 'g1', robotGraph, {});
    expect(strategy?.preferences.handsOn).toBe(1);
    expect(strategy?.changelog.some((e) => /hands-on/.test(e.message))).toBe(true);
    expect(await loadCurrentTask(repo, 'u1', 'g1')).toBeNull();
    expect(await repo.list('u1', 'reflections')).toHaveLength(1);
  });

  it('marks the track step done once the concept is mastered', async () => {
    const repo = await setup(0.7);
    const result = await completeTask(repo, 'u1', goal, task, { outcome: 'nailed', chips: [] });
    expect(result.mastered).toBe(true);
    const track = await repo.get<Track>('u1', 'tracks', 'g1');
    expect(track?.steps.find((s) => s.conceptId === 'basics/variables')?.status).toBe('done');
    expect(track?.steps.find((s) => s.conceptId === 'basics/loops')?.status).toBe('available');
  });

  it('feeds the outcome into adaptive pacing', async () => {
    const repo = await setup(0.5);
    await completeTask(repo, 'u1', goal, task, { outcome: 'struggled', chips: [] });
    await saveCurrentTask(repo, 'u1', task);
    await completeTask(repo, 'u1', goal, task, { outcome: 'struggled', chips: [] });
    const strategy = await loadStrategy(repo, 'u1', 'g1', robotGraph, {});
    expect(strategy?.difficulty).toBe(1);
  });
});
