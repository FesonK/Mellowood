import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalSummaryCard } from '../GoalSummaryCard';

const summary = {
  title: 'Robot arm that sorts Lego',
  endGoal: 'Build a robot arm that sorts Lego by colour',
  domain: 'Robotics',
  constraints: ['About 5 hours a week', 'I have an Arduino'],
};

describe('GoalSummaryCard', () => {
  it('shows the end goal, domain and constraints', () => {
    render(<GoalSummaryCard summary={summary} onConfirm={vi.fn()} onRevise={vi.fn()} />);
    const card = screen.getByRole('region', { name: /your goal/i });
    expect(card).toHaveTextContent(summary.endGoal);
    expect(card).toHaveTextContent('Robotics');
    expect(card).toHaveTextContent('About 5 hours a week');
    expect(card).toHaveTextContent('I have an Arduino');
  });

  it('confirms with "Looks right"', async () => {
    const onConfirm = vi.fn();
    render(<GoalSummaryCard summary={summary} onConfirm={onConfirm} onRevise={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /looks right/i }));
    expect(onConfirm).toHaveBeenCalledWith(summary);
  });

  it('goes back to the chat with "Not quite"', async () => {
    const onRevise = vi.fn();
    render(<GoalSummaryCard summary={summary} onConfirm={vi.fn()} onRevise={onRevise} />);
    await userEvent.click(screen.getByRole('button', { name: /not quite/i }));
    expect(onRevise).toHaveBeenCalled();
  });

  it('handles a goal without constraints', () => {
    render(<GoalSummaryCard summary={{ ...summary, constraints: [] }} onConfirm={vi.fn()} onRevise={vi.fn()} />);
    expect(screen.getByText(/no constraints yet/i)).toBeInTheDocument();
  });
});
