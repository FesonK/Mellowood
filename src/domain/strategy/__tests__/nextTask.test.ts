import { advance, createStrategy, nextTask, FRAMINGS } from '../strategy';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';
import { c } from '@/domain/graph/__tests__/fixtures';

describe('nextTask', () => {
  it('picks the learnable concept that unlocks the most of the path', () => {
    // variables unlocks 4 later concepts, ohms-law unlocks 3
    expect(nextTask(createStrategy('g1', robotGraph, {}))?.conceptId).toBe('basics/variables');
    // now ohms-law (3) beats functions (2) and loops (1)
    expect(nextTask(createStrategy('g1', robotGraph, { 'basics/variables': 0.8 }))?.conceptId).toBe('electronics/ohms-law');
  });

  it('breaks ties by topological order', () => {
    const graph = { goal: 'x', concepts: [c('a'), c('b'), c('goal', ['a', 'b'])] };
    expect(nextTask(createStrategy('g', graph, {}))?.conceptId).toBe('a');
  });

  it('returns null once everything is mastered', () => {
    const all = Object.fromEntries(robotGraph.concepts.map((x) => [x.id, 1]));
    expect(nextTask(createStrategy('g1', robotGraph, all))).toBeNull();
  });

  it('revisits queued remediation concepts first', () => {
    const state = { ...createStrategy('g1', robotGraph, {}), remediation: ['electronics/ohms-law'] };
    expect(nextTask(state)).toMatchObject({ conceptId: 'electronics/ohms-law', reason: 'revisit' });
  });

  it('keeps difficulty within 1..5 and raises it for partly known concepts', () => {
    const fresh = nextTask(createStrategy('g1', robotGraph, {}))!;
    const partial = nextTask({ ...createStrategy('g1', robotGraph, { 'basics/variables': 0.6 }) })!;
    expect(fresh.difficulty).toBeGreaterThanOrEqual(1);
    expect(partial.difficulty).toBeGreaterThan(fresh.difficulty);
    expect(nextTask({ ...createStrategy('g1', robotGraph, { 'basics/variables': 0.7 }), difficulty: 5 })!.difficulty).toBe(5);
  });

  it('rotates framings without repeating one back to back', () => {
    let state = createStrategy('g1', robotGraph, {});
    const seen: string[] = [];
    for (let i = 0; i < 8; i++) {
      const plan = nextTask(state)!;
      expect(FRAMINGS).toContain(plan.framing);
      seen.push(plan.framing);
      state = advance(state, plan);
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
    expect(new Set(seen).size).toBeGreaterThanOrEqual(3);
  });

  it('is pure', () => {
    const state = createStrategy('g1', robotGraph, {});
    const before = JSON.stringify(state);
    nextTask(state);
    expect(JSON.stringify(state)).toBe(before);
  });
});
