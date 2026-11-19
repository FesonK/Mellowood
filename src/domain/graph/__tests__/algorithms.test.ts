import {
  topoSort,
  ancestors,
  dependents,
  descendants,
  depthLayers,
  frontier,
  goalConcepts,
  MASTERED,
} from '../algorithms';
import { robotGraph } from './fixtures';

describe('graph algorithms', () => {
  it('topoSort puts every prerequisite before its dependents, deterministically', () => {
    const order = topoSort(robotGraph);
    expect(order).toEqual([
      'basics/variables',
      'electronics/ohms-law',
      'basics/loops',
      'basics/functions',
      'electronics/pwm',
      'robotics/servo-control',
      'robotics/sorting-arm',
    ]);
    for (const concept of robotGraph.concepts) {
      for (const p of concept.prerequisites) expect(order.indexOf(p)).toBeLessThan(order.indexOf(concept.id));
    }
  });

  it('ancestors returns all transitive prerequisites', () => {
    expect([...ancestors(robotGraph, 'robotics/servo-control')].sort()).toEqual([
      'basics/functions',
      'basics/variables',
      'electronics/ohms-law',
      'electronics/pwm',
    ]);
    expect(ancestors(robotGraph, 'basics/variables').size).toBe(0);
  });

  it('dependents returns direct dependents and descendants all of them', () => {
    expect(dependents(robotGraph, 'basics/variables').sort()).toEqual(['basics/functions', 'basics/loops']);
    expect(descendants(robotGraph, 'electronics/ohms-law').size).toBe(3);
  });

  it('depthLayers groups by longest prerequisite chain', () => {
    expect(depthLayers(robotGraph)).toEqual([
      ['basics/variables', 'electronics/ohms-law'],
      ['basics/loops', 'basics/functions', 'electronics/pwm'],
      ['robotics/servo-control'],
      ['robotics/sorting-arm'],
    ]);
  });

  it('frontier lists unmastered concepts whose prerequisites are all mastered', () => {
    expect(frontier(robotGraph, {})).toEqual(['basics/variables', 'electronics/ohms-law']);
    expect(frontier(robotGraph, { 'basics/variables': MASTERED, 'electronics/ohms-law': 0.5 })).toEqual([
      'electronics/ohms-law',
      'basics/loops',
      'basics/functions',
    ]);
  });

  it('goalConcepts are the sinks of the graph', () => {
    expect(goalConcepts(robotGraph)).toEqual(['robotics/sorting-arm']);
  });
});
