import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlacementQuiz } from '../PlacementQuiz';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';
import { KNOWN_MASTERY } from '@/domain/placement/placement';

describe('PlacementQuiz', () => {
  it('asks weekly hours first, then short know-it questions, then reports the result', async () => {
    const onComplete = vi.fn();
    render(<PlacementQuiz graph={robotGraph} onComplete={onComplete} />);

    const hours = screen.getByRole('slider', { name: /hours a week/i });
    expect(hours).toHaveValue('5');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Answer "I know it" to every question: everything becomes known.
    while (screen.queryByRole('button', { name: /i know it/i })) {
      expect(screen.getByRole('heading', { name: /do you already know/i })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /i know it/i }));
    }
    expect(onComplete).toHaveBeenCalledOnce();
    const [{ mastery, weeklyHours }] = onComplete.mock.calls[0];
    expect(weeklyHours).toBe(5);
    expect(Object.values(mastery).every((v) => v === KNOWN_MASTERY)).toBe(true);
  });

  it('shows progress through the questions', async () => {
    render(<PlacementQuiz graph={robotGraph} onComplete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText(/question 1/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /not yet/i }));
    expect(screen.getByText(/question 2/i)).toBeInTheDocument();
  });
});
