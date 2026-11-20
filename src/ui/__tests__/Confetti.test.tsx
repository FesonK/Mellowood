import { render } from '@testing-library/react';
import { Confetti } from '../Confetti';

describe('Confetti', () => {
  it('renders decorative pieces hidden from assistive tech', () => {
    const { container } = render(<Confetti pieces={12} />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root.children).toHaveLength(12);
  });

  it('renders nothing when the user prefers reduced motion', () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ ...original(q), matches: q.includes('reduce') })) as typeof window.matchMedia;
    try {
      const { container } = render(<Confetti pieces={12} />);
      expect(container).toBeEmptyDOMElement();
    } finally {
      window.matchMedia = original;
    }
  });
});
