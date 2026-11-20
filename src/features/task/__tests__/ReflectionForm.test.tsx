import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReflectionForm } from '../ReflectionForm';

describe('ReflectionForm', () => {
  it('needs a self-assessment before it can be submitted', async () => {
    render(<ReflectionForm onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /finish task/i })).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: /mostly/i }));
    expect(screen.getByRole('button', { name: /finish task/i })).toBeEnabled();
  });

  it('submits the outcome, chips and notes', async () => {
    const onSubmit = vi.fn();
    render(<ReflectionForm onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('radio', { name: /nailed it/i }));
    await userEvent.click(screen.getByRole('button', { name: /more hands-on/i }));
    await userEvent.type(screen.getByLabelText(/what did you like/i), 'The wiring');
    await userEvent.type(screen.getByLabelText(/what didn.t you like/i), 'Too much reading');
    await userEvent.type(screen.getByLabelText(/how should your plan change/i), 'More robots');
    await userEvent.click(screen.getByRole('button', { name: /finish task/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      outcome: 'nailed',
      chips: ['more-hands-on'],
      liked: 'The wiring',
      disliked: 'Too much reading',
      strategyChange: 'More robots',
    });
  });

  it('toggles chips off again', async () => {
    render(<ReflectionForm onSubmit={vi.fn()} />);
    const chip = screen.getByRole('button', { name: /harder/i });
    await userEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });
});
