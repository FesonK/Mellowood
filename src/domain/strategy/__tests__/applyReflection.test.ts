import { applyReflection, REFLECTION_CHIPS } from '../reflection';
import { createStrategy } from '../strategy';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';

const base = createStrategy('g1', robotGraph, {});

describe('applyReflection', () => {
  it('maps each chip to a preference change and exactly one changelog entry', () => {
    for (const chip of REFLECTION_CHIPS) {
      const next = applyReflection(base, { chips: [chip.id] });
      expect(next.changelog).toHaveLength(1);
      expect(next.preferences).not.toEqual(base.preferences);
    }
  });

  it('leans hands-on when asked for more building', () => {
    const next = applyReflection(base, { chips: ['more-hands-on'] });
    expect(next.preferences.handsOn).toBe(1);
    expect(next.changelog[0].message).toMatch(/hands-on/i);
  });

  it('ignores duplicate chips in one reflection', () => {
    const next = applyReflection(base, { chips: ['harder', 'harder'] });
    expect(next.preferences.challenge).toBe(1);
    expect(next.changelog).toHaveLength(1);
  });

  it('keeps preferences within -2..2', () => {
    let s = base;
    for (let i = 0; i < 5; i++) s = applyReflection(s, { chips: ['easier'] });
    expect(s.preferences.challenge).toBe(-2);
  });

  it('changes nothing without chips', () => {
    expect(applyReflection(base, { chips: [] })).toEqual(base);
  });
});
