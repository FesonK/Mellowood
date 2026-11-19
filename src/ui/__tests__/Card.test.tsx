import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children inside a section with an optional title', () => {
    render(<Card title="Your goal">Hello</Card>);
    expect(screen.getByRole('region', { name: 'Your goal' })).toHaveTextContent('Hello');
  });
});
