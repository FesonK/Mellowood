import { GraphCache, normalizeGoalKey, DEFAULT_TTL_MS } from '../graphCache';
import { robotGraph } from './fixtures';
import type { GoalSummary } from '@/ai/types';

const summary: GoalSummary = {
  title: 'Robot',
  endGoal: '  Build a   Robot Arm ',
  domain: 'Robotics',
  constraints: [],
};

describe('normalizeGoalKey', () => {
  it('lowercases, trims and collapses whitespace, and includes the domain', () => {
    expect(normalizeGoalKey(summary)).toBe('robotics::build a robot arm');
    expect(normalizeGoalKey({ ...summary, endGoal: 'build a robot arm' })).toBe(normalizeGoalKey(summary));
  });
});

describe('GraphCache', () => {
  let now = 0;
  const clock = () => now;
  beforeEach(() => {
    now = 1_000;
  });

  it('calls the generator on a miss and stores the result', async () => {
    const cache = new GraphCache(localStorage, { now: clock });
    const generate = vi.fn(async () => robotGraph);
    expect(await cache.getOrCreate(summary, generate)).toEqual(robotGraph);
    expect(generate).toHaveBeenCalledOnce();
  });

  it('skips the generator on a hit, even for differently spaced goals', async () => {
    const cache = new GraphCache(localStorage, { now: clock });
    await cache.getOrCreate(summary, async () => robotGraph);
    const generate = vi.fn(async () => robotGraph);
    await new GraphCache(localStorage, { now: clock }).getOrCreate({ ...summary, endGoal: 'build a robot arm' }, generate);
    expect(generate).not.toHaveBeenCalled();
  });

  it('refetches after the TTL expires', async () => {
    const cache = new GraphCache(localStorage, { now: clock });
    await cache.getOrCreate(summary, async () => robotGraph);
    now += DEFAULT_TTL_MS + 1;
    const generate = vi.fn(async () => robotGraph);
    await cache.getOrCreate(summary, generate);
    expect(generate).toHaveBeenCalledOnce();
  });

  it('honours a custom TTL', async () => {
    const cache = new GraphCache(localStorage, { now: clock, ttlMs: 10 });
    await cache.getOrCreate(summary, async () => robotGraph);
    now += 11;
    expect(cache.peek(summary)).toBeNull();
  });

  it('does not cache failures', async () => {
    const cache = new GraphCache(localStorage, { now: clock });
    await expect(cache.getOrCreate(summary, async () => Promise.reject(new Error('x')))).rejects.toThrow();
    expect(cache.peek(summary)).toBeNull();
  });
});
