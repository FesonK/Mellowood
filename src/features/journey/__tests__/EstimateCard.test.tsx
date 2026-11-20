import { render, screen } from '@testing-library/react';
import { EstimateCard } from '../EstimateCard';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';

describe('EstimateCard', () => {
  it('shows the personal estimate and the concepts left', () => {
    render(<EstimateCard graph={robotGraph} mastery={{ 'basics/variables': 0.8 }} weeklyHours={5} />);
    const card = screen.getByRole('region', { name: /time to learn/i });
    // 20 total hours - 1 mastered = 19 h -> 4 weeks at 5 h/week
    expect(card).toHaveTextContent('about 4 weeks at 5 h/week');
    expect(card).toHaveTextContent(/6 concepts to grow/i);
    expect(card).toHaveTextContent(/19 h/);
  });
});
