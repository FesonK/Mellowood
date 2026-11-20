import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '../TaskCard';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';
import type { TaskContent } from '@/ai/types';

const task: TaskContent = {
  hook: 'Make a servo wave hello',
  story: 'Your robot arm needs to greet the Lego bricks before sorting them.',
  steps: ['Wire the servo', 'Write a sweep function', 'Tune the speed'],
  doneWhen: ['The servo sweeps 0 to 180 degrees', 'You can change the speed'],
  hints: ['h1', 'h2', 'h3'],
};
const plan = { conceptId: 'robotics/servo-control', difficulty: 3, framing: 'build' as const, reason: 'next' as const };

describe('TaskCard', () => {
  it('presents the task as an enticing problem with steps and a done-when checklist', () => {
    render(<TaskCard task={task} plan={plan} graph={robotGraph} mastery={{}} />);
    expect(screen.getByRole('heading', { name: task.hook })).toBeInTheDocument();
    expect(screen.getByText(task.story)).toBeInTheDocument();
    const steps = within(screen.getByRole('list', { name: /steps/i })).getAllByRole('listitem');
    expect(steps.map((s) => s.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('Wire the servo')]));
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('lets the learner tick off done-when items', async () => {
    render(<TaskCard task={task} plan={plan} graph={robotGraph} mastery={{}} />);
    const box = screen.getByRole('checkbox', { name: /sweeps 0 to 180/i });
    await userEvent.click(box);
    expect(box).toBeChecked();
  });

  it('shows framing and difficulty', () => {
    render(<TaskCard task={task} plan={plan} graph={robotGraph} mastery={{}} />);
    expect(screen.getByText(/build/i, { selector: '[data-tone]' })).toBeInTheDocument();
    expect(screen.getByLabelText(/difficulty 3 of 5/i)).toBeInTheDocument();
  });

  it('highlights the target concept and its direct prerequisites on a mini graph', () => {
    render(<TaskCard task={task} plan={plan} graph={robotGraph} mastery={{}} />);
    expect(screen.getByRole('button', { name: /servo control/i })).toHaveAttribute('data-highlighted', 'true');
    expect(screen.getByRole('button', { name: /^pwm/i })).toHaveAttribute('data-highlighted', 'true');
    expect(screen.getByRole('button', { name: /sorting arm/i })).toHaveAttribute('data-highlighted', 'false');
  });
});
