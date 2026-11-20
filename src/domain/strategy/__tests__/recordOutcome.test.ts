import { classifyOutcome, recordOutcome } from '../pace';
import { createStrategy, nextTask } from '../strategy';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';

const servo = 'robotics/servo-control';

describe('classifyOutcome', () => {
  it('reads explicit feedback first, then mastery gain', () => {
    expect(classifyOutcome({ conceptId: servo, feedback: 'too-hard', masteryGain: 0.5 })).toBe('struggle');
    expect(classifyOutcome({ conceptId: servo, feedback: 'too-easy', masteryGain: 0 })).toBe('easy');
    expect(classifyOutcome({ conceptId: servo, masteryGain: 0.05 })).toBe('struggle');
    expect(classifyOutcome({ conceptId: servo, masteryGain: 0.35 })).toBe('easy');
    expect(classifyOutcome({ conceptId: servo, masteryGain: 0.2 })).toBe('ok');
  });
});

describe('recordOutcome', () => {
  const base = { ...createStrategy('g1', robotGraph, { 'basics/functions': 0.5, 'electronics/pwm': 0.9 }), difficulty: 3 };

  it('slows down and goes back to a weak prerequisite after two struggles in a row', () => {
    let s = recordOutcome(base, { conceptId: servo, feedback: 'too-hard' });
    expect(s.difficulty).toBe(3);
    s = recordOutcome(s, { conceptId: servo, masteryGain: 0.02 });
    expect(s.difficulty).toBe(2);
    expect(s.remediation).toEqual(['basics/functions']);
    expect(nextTask(s)?.conceptId).toBe('basics/functions');
    expect(s.changelog.at(-1)?.message).toMatch(/slow down/i);
  });

  it('speeds up after two easy wins in a row', () => {
    let s = recordOutcome(base, { conceptId: servo, feedback: 'too-easy' });
    s = recordOutcome(s, { conceptId: servo, masteryGain: 0.4 });
    expect(s.difficulty).toBe(4);
    expect(s.changelog.at(-1)?.message).toMatch(/pick up the pace/i);
  });

  it('does not react to mixed signals', () => {
    let s = recordOutcome(base, { conceptId: servo, feedback: 'too-hard' });
    s = recordOutcome(s, { conceptId: servo, feedback: 'too-easy' });
    expect(s.difficulty).toBe(3);
  });

  it('clamps difficulty to 1..5', () => {
    let low = { ...base, difficulty: 1 };
    for (let i = 0; i < 4; i++) low = recordOutcome(low, { conceptId: servo, feedback: 'too-hard' });
    expect(low.difficulty).toBe(1);
    let high = { ...base, difficulty: 5 };
    for (let i = 0; i < 4; i++) high = recordOutcome(high, { conceptId: servo, feedback: 'too-easy' });
    expect(high.difficulty).toBe(5);
  });

  it('does not queue the same remediation twice', () => {
    let s = base;
    for (let i = 0; i < 4; i++) s = recordOutcome(s, { conceptId: servo, feedback: 'too-hard' });
    expect(s.remediation).toEqual(['basics/functions']);
  });
});
