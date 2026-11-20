import { render, screen } from '@testing-library/react';
import { MasteryRing } from '../MasteryRing';

describe('MasteryRing', () => {
  it('exposes the mastery value', () => {
    render(<MasteryRing value={0.45} label="Servo control" />);
    expect(screen.getByRole('progressbar', { name: /servo control mastery/i })).toHaveAttribute('aria-valuenow', '45');
    expect(screen.queryByRole('img', { name: /mastered/i })).not.toBeInTheDocument();
  });

  it('sparkles when mastered', () => {
    render(<MasteryRing value={0.85} label="Servo control" />);
    expect(screen.getByRole('img', { name: /mastered/i })).toBeInTheDocument();
  });
});
