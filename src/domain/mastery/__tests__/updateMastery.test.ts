import { updateMastery, OUTCOME_TARGET, type SelfAssessment } from '../updateMastery';

const outcomes: SelfAssessment[] = ['nailed', 'mostly', 'struggled'];

describe('updateMastery', () => {
  it.each([0, 0.3, 0.7, 1])('stays within 0..1 from %s', (m) => {
    for (const o of outcomes) {
      const next = updateMastery(m, o);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThanOrEqual(1);
    }
  });

  it('moves toward the target for the outcome', () => {
    for (const o of outcomes) {
      const target = OUTCOME_TARGET[o];
      const next = updateMastery(0.2, o);
      expect(Math.abs(target - next)).toBeLessThan(Math.abs(target - 0.2));
    }
  });

  it('rewards nailed > mostly > struggled from the same start', () => {
    const [n, m, s] = outcomes.map((o) => updateMastery(0.3, o));
    expect(n).toBeGreaterThan(m);
    expect(m).toBeGreaterThan(s);
  });

  it('reaches mastery after a couple of nailed tasks from scratch', () => {
    expect(updateMastery(updateMastery(updateMastery(0, 'nailed'), 'nailed'), 'nailed')).toBeGreaterThanOrEqual(0.8);
  });

  it('guards against bad input', () => {
    expect(updateMastery(Number.NaN, 'nailed')).toBeGreaterThan(0);
  });
});
