import { buildTrack, refreshTrack, trackProgress } from '../track';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';
import { topoSort } from '@/domain/graph';

const statuses = (track: ReturnType<typeof buildTrack>) =>
  Object.fromEntries(track.steps.map((s) => [s.conceptId, s.status]));

describe('buildTrack', () => {
  it('orders steps topologically for a beginner', () => {
    const track = buildTrack('g1', robotGraph, {});
    expect(track.steps.map((s) => s.conceptId)).toEqual(topoSort(robotGraph));
  });

  it('skips concepts that are already mastered', () => {
    const track = buildTrack('g1', robotGraph, { 'basics/variables': 0.8, 'electronics/ohms-law': 0.95 });
    expect(track.steps.map((s) => s.conceptId)).not.toContain('basics/variables');
    expect(track.steps.map((s) => s.conceptId)).not.toContain('electronics/ohms-law');
  });

  it('makes a step available only when all its prerequisites are mastered', () => {
    const s = statuses(buildTrack('g1', robotGraph, { 'basics/variables': 0.8 }));
    expect(s['basics/loops']).toBe('available');
    expect(s['basics/functions']).toBe('available');
    expect(s['electronics/ohms-law']).toBe('available');
    expect(s['electronics/pwm']).toBe('locked');
    expect(s['robotics/sorting-arm']).toBe('locked');
  });
});

describe('refreshTrack', () => {
  it('marks mastered steps done and unlocks what follows, keeping the original steps', () => {
    const track = buildTrack('g1', robotGraph, {});
    const next = refreshTrack(track, robotGraph, { 'basics/variables': 0.85 });
    const s = statuses(next);
    expect(next.steps).toHaveLength(track.steps.length);
    expect(s['basics/variables']).toBe('done');
    expect(s['basics/loops']).toBe('available');
  });
});

describe('trackProgress', () => {
  it('reports done / total', () => {
    const track = refreshTrack(buildTrack('g1', robotGraph, {}), robotGraph, { 'basics/variables': 1 });
    expect(trackProgress(track)).toEqual({ done: 1, total: 7, ratio: 1 / 7 });
  });
});
