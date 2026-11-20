import { fromScratch, mergePlacement } from '../placement';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';

describe('fromScratch', () => {
  it('sets every concept in the graph to 0', () => {
    const m = fromScratch(robotGraph);
    expect(Object.keys(m)).toHaveLength(robotGraph.concepts.length);
    expect(Object.values(m).every((v) => v === 0)).toBe(true);
  });
});

describe('mergePlacement', () => {
  it('only ever raises mastery', () => {
    expect(mergePlacement({ a: 0.8, b: 0.3 }, { a: 0, b: 0.8, c: 0.8 })).toEqual({ a: 0.8, b: 0.8, c: 0.8 });
  });
});
