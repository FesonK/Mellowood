import { estimateTimeToLearn, formatEstimate } from '../estimate';
import { c } from '@/domain/graph/__tests__/fixtures';
import type { ConceptGraph } from '@/domain/graph/types';

const graph: ConceptGraph = { goal: 'x', concepts: [c('a', [], 10), c('b', ['a'], 10), c('c', ['b'], 10)] };

describe('estimateTimeToLearn', () => {
  it('sums hours weighted by what is left to learn', () => {
    expect(estimateTimeToLearn(graph, { a: 0.5 }, 5)).toEqual({ remainingHours: 25, weeks: 5 });
  });

  it('excludes mastered concepts entirely', () => {
    expect(estimateTimeToLearn(graph, { a: 0.8, b: 0.9 }, 5).remainingHours).toBe(10);
  });

  it('rounds weeks up', () => {
    expect(estimateTimeToLearn(graph, {}, 7).weeks).toBe(5);
  });

  it('guards against zero weekly hours', () => {
    expect(estimateTimeToLearn(graph, {}, 0).weeks).toBeNull();
  });
});

describe('formatEstimate', () => {
  it('reads naturally', () => {
    expect(formatEstimate({ remainingHours: 30, weeks: 6 }, 5)).toBe('about 6 weeks at 5 h/week');
    expect(formatEstimate({ remainingHours: 4, weeks: 1 }, 5)).toBe('about 1 week at 5 h/week');
    expect(formatEstimate({ remainingHours: 0, weeks: 0 }, 5)).toBe('you already know it all!');
    expect(formatEstimate({ remainingHours: 10, weeks: null }, 0)).toBe('about 10 hours of focused learning');
  });
});
