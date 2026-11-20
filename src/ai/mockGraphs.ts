import type { Concept, ConceptGraph } from '@/domain/graph/types';
import type { GoalSummary } from './types';

type Row = [id: string, name: string, summary: string, hours: number, prerequisites: string[]];

const TEMPLATES: Record<string, Row[]> = {
  Robotics: [
    ['programming/variables', 'Variables & types', 'Store and name values so your code can remember things.', 2, []],
    ['programming/control-flow', 'Loops & conditions', 'Make decisions and repeat actions.', 3, ['programming/variables']],
    ['programming/functions', 'Functions', 'Package behaviour into reusable pieces.', 3, ['programming/variables']],
    ['electronics/circuits', 'Basic circuits', "Voltage, current and Ohm's law on a breadboard.", 4, []],
    ['electronics/microcontrollers', 'Microcontrollers', 'Program an Arduino to read inputs and drive outputs.', 5, ['electronics/circuits', 'programming/control-flow']],
    ['electronics/pwm', 'PWM signals', 'Pulse-width modulation to control speed and position.', 2, ['electronics/microcontrollers']],
    ['robotics/servo-control', 'Servo control', 'Move servos to precise angles.', 4, ['electronics/pwm', 'programming/functions']],
    ['robotics/kinematics', 'Arm kinematics', 'Turn joint angles into a gripper position and back.', 6, ['robotics/servo-control']],
    ['robotics/color-sensing', 'Colour sensing', 'Read a colour sensor and classify what it sees.', 4, ['electronics/microcontrollers']],
  ],
  'Machine Learning': [
    ['programming/python-basics', 'Python basics', 'Variables, lists, loops and functions in Python.', 6, []],
    ['math/vectors', 'Vectors', 'Lists of numbers with direction and length.', 3, []],
    ['data/data-handling', 'Working with data', 'Load, clean and explore data with pandas.', 5, ['programming/python-basics']],
    ['math/probability', 'Probability', 'Reason about uncertainty and likelihood.', 4, []],
    ['ml/embeddings', 'Embeddings', 'Represent words and documents as vectors.', 4, ['math/vectors', 'data/data-handling']],
    ['ml/language-models', 'Language models', 'How LLMs predict the next token.', 4, ['ml/embeddings', 'math/probability']],
    ['ml/prompting', 'Prompt design', 'Write instructions that get reliable answers.', 3, ['ml/language-models']],
    ['software/apis', 'Calling APIs', 'Send requests to web services and handle responses.', 3, ['programming/python-basics']],
  ],
  'Software Development': [
    ['web/html', 'HTML', 'Structure a page with semantic elements.', 3, []],
    ['web/css', 'CSS', 'Style layouts, colours and spacing.', 5, ['web/html']],
    ['programming/javascript', 'JavaScript', 'Variables, functions and events in the browser.', 8, []],
    ['web/dom', 'The DOM', 'Change the page from code.', 3, ['web/html', 'programming/javascript']],
    ['web/components', 'Components', 'Build UIs from small reusable pieces.', 6, ['web/dom', 'web/css']],
    ['software/apis', 'Calling APIs', 'Fetch data from web services.', 3, ['programming/javascript']],
    ['software/deployment', 'Deployment', 'Put your app on the internet for others.', 3, ['web/components', 'software/apis']],
  ],
  Music: [
    ['music/rhythm', 'Rhythm & counting', 'Feel the beat and count bars.', 3, []],
    ['guitar/posture', 'Holding the guitar', 'Comfortable posture and hand position.', 1, []],
    ['guitar/open-chords', 'Open chords', 'Your first shapes: G, C, D, E minor.', 6, ['guitar/posture']],
    ['guitar/strumming', 'Strumming patterns', 'Down-up patterns that groove.', 4, ['music/rhythm', 'guitar/posture']],
    ['guitar/chord-changes', 'Smooth chord changes', 'Switch shapes in time.', 6, ['guitar/open-chords', 'guitar/strumming']],
    ['music/song-structure', 'Song structure', 'Verses, choruses and bridges.', 2, ['music/rhythm']],
    ['guitar/barre-chords', 'Barre chords', 'Movable shapes for any key.', 8, ['guitar/chord-changes']],
  ],
};

const GENERAL: Row[] = [
  ['learning/foundations', 'Foundations', 'The core vocabulary and ideas of the field.', 4, []],
  ['learning/tools', 'Tools & materials', 'What you need and how to use it safely.', 2, []],
  ['learning/basic-techniques', 'Basic techniques', 'The handful of moves you will use all the time.', 6, ['learning/foundations', 'learning/tools']],
  ['learning/practice-project', 'A tiny practice project', 'Put the basics together on something small.', 4, ['learning/basic-techniques']],
  ['learning/intermediate-techniques', 'Intermediate techniques', 'Combine basics into richer results.', 8, ['learning/basic-techniques']],
  ['learning/troubleshooting', 'Troubleshooting', 'Diagnose and fix common mistakes.', 3, ['learning/practice-project']],
];

export function slugify(text: string, max = 40) {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
  return slug || 'goal';
}

export function mockGraphFor(summary: GoalSummary): ConceptGraph {
  const rows = TEMPLATES[summary.domain] ?? GENERAL;
  const concepts: Concept[] = rows.map(([id, name, s, hours, prerequisites]) => ({
    id,
    name,
    summary: s,
    hours,
    prerequisites,
  }));
  const required = new Set(concepts.flatMap((c) => c.prerequisites));
  const sinks = concepts.filter((c) => !required.has(c.id)).map((c) => c.id);
  concepts.push({
    id: `projects/${slugify(summary.endGoal)}`,
    name: summary.endGoal,
    summary: `Your capstone: ${summary.endGoal}. Everything above builds toward this.`,
    hours: 8,
    prerequisites: sinks,
  });
  return { goal: summary.endGoal, concepts };
}
