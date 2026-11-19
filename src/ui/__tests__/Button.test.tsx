import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders an accessible button and handles clicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Start</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies the variant as a data attribute', () => {
    render(<Button variant="resume">Resume</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'resume');
  });

  it('defaults to type="button" and supports loading state', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });
});
