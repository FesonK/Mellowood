import { MockAIProvider } from '../mockProvider';
import { validateGraph, goalConcepts } from '@/domain/graph';
import type { GoalSummary } from '../types';

const ai = new MockAIProvider({ delayMs: 0 });
const summary = (domain: string, endGoal: string): GoalSummary => ({
  title: endGoal,
  endGoal,
  domain,
  constraints: [],
});

describe('MockAIProvider.generateGraph', () => {
  it.each([
    ['Robotics', 'Build a robot arm that sorts Lego'],
    ['Machine Learning', 'Make a chatbot for my bakery'],
    ['Software Development', 'Ship my first web app'],
    ['Music', 'Play my favourite song on guitar'],
    ['General', 'Knit a cozy scarf'],
  ])('produces a valid graph for %s', async (domain, goal) => {
    const graph = await ai.generateGraph(summary(domain, goal));
    expect(validateGraph(graph)).toEqual({ ok: true });
    expect(graph.goal).toBe(goal);
    expect(graph.concepts.length).toBeGreaterThanOrEqual(6);
  });

  it('ends in a single capstone concept named after the goal', async () => {
    const graph = await ai.generateGraph(summary('Robotics', 'Build a robot arm that sorts Lego'));
    const goals = goalConcepts(graph);
    expect(goals).toHaveLength(1);
    expect(graph.concepts.find((c) => c.id === goals[0])?.name).toMatch(/robot arm that sorts lego/i);
  });

  it('is deterministic for the same goal', async () => {
    const s = summary('Music', 'Play guitar');
    expect(await ai.generateGraph(s)).toEqual(await ai.generateGraph(s));
  });
});
