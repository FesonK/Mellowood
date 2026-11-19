import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { LandingPage, EXAMPLE_GOALS, ROTATE_MS } from '../LandingPage';
import { renderApp } from '@/test/renderApp';

function GoalProbe() {
  const { search } = useLocation();
  return <p>goal page {new URLSearchParams(search).get('q')}</p>;
}

describe('LandingPage', () => {
  it('greets the learner with the mascot and a big question', () => {
    renderApp(<LandingPage />);
    expect(screen.getByRole('img', { name: /mellow/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/what do you want to learn/i);
  });

  it('cannot submit an empty or whitespace-only goal', async () => {
    renderApp(<LandingPage />);
    const button = screen.getByRole('button', { name: /let.s go/i });
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/what do you want to learn/i), '   ');
    expect(button).toBeDisabled();
  });

  it('submits with Enter and starts the goal conversation', async () => {
    renderApp(<LandingPage />, { routes: { '/goal/new': <GoalProbe /> } });
    await userEvent.type(screen.getByLabelText(/what do you want to learn/i), '  learn AI {Enter}');
    expect(await screen.findByText('goal page learn AI')).toBeInTheDocument();
  });

  it('rotates example goals over time', () => {
    vi.useFakeTimers();
    try {
      renderApp(<LandingPage />);
      const input = screen.getByLabelText(/what do you want to learn/i);
      expect(input).toHaveAttribute('placeholder', EXAMPLE_GOALS[0]);
      act(() => vi.advanceTimersByTime(ROTATE_MS));
      expect(input).toHaveAttribute('placeholder', EXAMPLE_GOALS[1]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('fills the input when an example chip is picked', async () => {
    renderApp(<LandingPage />);
    await userEvent.click(screen.getByRole('button', { name: EXAMPLE_GOALS[2] }));
    expect(screen.getByLabelText(/what do you want to learn/i)).toHaveValue(EXAMPLE_GOALS[2]);
  });
});
