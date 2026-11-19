import { render, screen } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('associates label and error message', () => {
    render(<Input label="Email" error="Please enter a valid email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Please enter a valid email');
  });

  it('is valid when there is no error', () => {
    render(<Input label="Name" />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'false');
  });
});
