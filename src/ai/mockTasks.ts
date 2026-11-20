import type { Framing } from '@/domain/strategy/strategy';
import type { TaskContent, TaskRequest } from './types';

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

const TEMPLATES: Record<Framing, (name: string, goal: string) => Omit<TaskContent, 'steps'> & { steps: string[] }> = {
  build: (name, goal) => ({
    hook: `Build a tiny ${name} gadget you can show off`,
    story: `Every great ${lower(goal)} starts with small wins. Today you'll make something small but real that uses ${name}, and you'll be able to point at it and say "I made that."`,
    steps: [
      `Sketch what your mini ${name} project will do in one sentence`,
      'Gather the smallest set of tools you need',
      `Build the simplest version that uses ${name}`,
      'Test it once and note what surprised you',
      'Add one tiny improvement you are proud of',
      'Explain how it works out loud, as if to a friend',
      'Take a photo or screenshot of the result',
    ],
    doneWhen: [`Your mini project clearly uses ${name}`, 'You can explain how it works in two sentences'],
    hints: [
      'Start smaller than feels necessary. Tiny is perfect.',
      `Look up one example of ${name} and copy its shape, then change one thing.`,
      `Break it into: input → ${name} → output, and build each piece alone first.`,
    ],
  }),
  investigate: (name, goal) => ({
    hook: `Solve the mystery: how does ${name} really work?`,
    story: `Somewhere inside "${lower(goal)}" hides ${name}. Become a detective: collect clues, poke at examples, and crack how it works.`,
    steps: [
      `Find two short explanations of ${name} from different sources`,
      'Write down the one idea they both agree on',
      'Find an example and predict what will happen before checking',
      'Change one thing in the example and observe',
      'Draw a tiny diagram of what you learned',
      'Write three questions you still have',
      'Answer one of your own questions',
    ],
    doneWhen: [`You can explain ${name} without notes`, 'Your prediction test is written down'],
    hints: [
      'Explain it badly first. Then improve it.',
      'Compare two examples side by side: what changes, what stays?',
      `Ask: what problem was ${name} invented to solve?`,
    ],
  }),
  fix: (name, goal) => ({
    hook: `Rescue mission: fix the broken ${name}`,
    story: `Oh no, a little helper on the road to "${lower(goal)}" is broken, and the bug lives right inside ${name}. Can you track it down and fix it?`,
    steps: [
      `Find or create a small example that uses ${name}`,
      'Break it on purpose in one specific way',
      'Describe the symptoms you see',
      'Form a guess about the cause',
      'Fix it and confirm the symptoms are gone',
      'Break it a different way and repeat',
      'Write a one-line rule to avoid this bug in future',
    ],
    doneWhen: ['You fixed at least one break', 'You wrote down the rule that prevents it'],
    hints: [
      'Change one thing at a time.',
      'Go back to the last version that worked and compare.',
      `Re-read the basic rule of ${name}. Is it being followed?`,
    ],
  }),
  challenge: (name, goal) => ({
    hook: `Speed-run challenge: master ${name} in one sitting`,
    story: `Time for a boss level on the path to "${lower(goal)}". Set a timer, use ${name} to beat the challenge, and see how far you get.`,
    steps: [
      'Set a 25-minute timer',
      `Solve a small puzzle that needs ${name}`,
      'Make it work for one more tricky case',
      'Make it faster, cleaner or prettier',
      'Teach the trick back in a short note',
      'Try a harder variant',
      'Celebrate, no matter how far you got!',
    ],
    doneWhen: [`You solved at least one puzzle using ${name}`, 'You attempted the tricky case'],
    hints: [
      'Solve the easiest version first, then upgrade.',
      'Write the steps in plain words before doing them.',
      `Compare with a worked example of ${name} and spot the difference.`,
    ],
  }),
};

export function mockTaskFor({ plan, concept, goal }: TaskRequest): TaskContent {
  const t = TEMPLATES[plan.framing](concept.name, goal.endGoal);
  const stepCount = Math.min(t.steps.length, Math.max(3, plan.difficulty + 2));
  return { ...t, steps: t.steps.slice(0, stepCount) };
}
