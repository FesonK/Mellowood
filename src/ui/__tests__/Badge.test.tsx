import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders text with a tone', () => {
    render(<Badge tone="mint">Mastered</Badge>);
    expect(screen.getByText('Mastered')).toHaveAttribute('data-tone', 'mint');
  });
});
