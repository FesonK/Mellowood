import { MockAIProvider } from '../mockProvider';
import { FRAMINGS } from '@/domain/strategy/strategy';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';
import type { GoalSummary } from '../types';

const ai = new MockAIProvider({ delayMs: 0 });
const goal: GoalSummary = { title: 'Robot arm', endGoal: 'Build a robot arm that sorts Lego', domain: 'Robotics', constraints: [] };
const concept = robotGraph.concepts.find((c) => c.id === 'robotics/servo-control')!;

describe('MockAIProvider.generateTask', () => {
  it.each(FRAMINGS)('produces a complete %s task about the concept', async (framing) => {
    const task = await ai.generateTask({
      plan: { conceptId: concept.id, difficulty: 2, framing, reason: 'next' },
      concept,
      goal,
    });
    expect(task.hook.toLowerCase()).toContain(concept.name.toLowerCase());
    expect(task.story.length).toBeGreaterThan(20);
    expect(task.steps.length).toBeGreaterThanOrEqual(3);
    expect(task.doneWhen.length).toBeGreaterThanOrEqual(2);
    expect(task.hints).toHaveLength(3);
  });

  it('mentions the end goal so the task feels purposeful', async () => {
    const task = await ai.generateTask({ plan: { conceptId: concept.id, difficulty: 2, framing: 'build', reason: 'next' }, concept, goal });
    expect(task.story).toMatch(/robot arm that sorts lego/i);
  });

  it('scales the number of steps with difficulty and is deterministic', async () => {
    const input = (difficulty: number) => ({ plan: { conceptId: concept.id, difficulty, framing: 'fix' as const, reason: 'next' as const }, concept, goal });
    const easy = await ai.generateTask(input(1));
    const hard = await ai.generateTask(input(5));
    expect(hard.steps.length).toBeGreaterThan(easy.steps.length);
    expect(await ai.generateTask(input(3))).toEqual(await ai.generateTask(input(3)));
  });
});
