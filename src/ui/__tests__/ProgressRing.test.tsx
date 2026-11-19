import { render, screen } from '@testing-library/react';
import { ProgressRing } from '../ProgressRing';

describe('ProgressRing', () => {
  it('exposes progress through aria attributes', () => {
    render(<ProgressRing value={0.42} label="Mastery" />);
    const ring = screen.getByRole('progressbar', { name: 'Mastery' });
    expect(ring).toHaveAttribute('aria-valuenow', '42');
    expect(ring).toHaveAttribute('aria-valuemin', '0');
    expect(ring).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps values outside 0..1', () => {
    render(<ProgressRing value={1.7} label="Over" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});
