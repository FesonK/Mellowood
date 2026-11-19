import type { Concept, ConceptGraph } from '../types';

export const c = (id: string, prerequisites: string[] = [], hours = 2): Concept => ({
  id,
  name: id.split('/').pop()!.replace(/-/g, ' '),
  summary: `About ${id}`,
  hours,
  prerequisites,
});

/**
 *   basics/variables ─┬─> basics/loops ─┐
 *                     └─> basics/functions ─┬─> robotics/servo-control ─> robotics/sorting-arm
 *   electronics/ohms-law ─> electronics/pwm ─┘
 */
export const robotGraph: ConceptGraph = {
  goal: 'Build a robot arm that sorts Lego',
  concepts: [
    c('basics/variables', [], 1),
    c('basics/loops', ['basics/variables'], 2),
    c('basics/functions', ['basics/variables'], 2),
    c('electronics/ohms-law', [], 3),
    c('electronics/pwm', ['electronics/ohms-law'], 2),
    c('robotics/servo-control', ['basics/functions', 'electronics/pwm'], 4),
    c('robotics/sorting-arm', ['robotics/servo-control', 'basics/loops'], 6),
  ],
};
