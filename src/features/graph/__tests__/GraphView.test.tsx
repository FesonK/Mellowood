import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphView, GraphSkeleton } from '../GraphView';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';

describe('GraphView', () => {
  it('renders every concept as a focusable node with its mastery', () => {
    render(<GraphView graph={robotGraph} mastery={{ 'basics/variables': 0.6 }} />);
    const map = screen.getByRole('group', { name: /concept map/i });
    expect(within(map).getAllByRole('button')).toHaveLength(robotGraph.concepts.length);
    expect(within(map).getByRole('button', { name: /variables.*60% mastered/i })).toBeInTheDocument();
  });

  it('shows a sparkle for mastered concepts', () => {
    render(<GraphView graph={robotGraph} mastery={{ 'basics/variables': 0.9 }} />);
    expect(screen.getByRole('button', { name: /variables.*mastered!/i })).toBeInTheDocument();
  });

  it('opens the concept details when a node is clicked', async () => {
    render(<GraphView graph={robotGraph} mastery={{}} />);
    await userEvent.click(screen.getByRole('button', { name: /servo control/i }));
    const details = screen.getByRole('region', { name: /servo control/i });
    expect(details).toHaveTextContent('About robotics/servo-control');
    expect(details).toHaveTextContent(/4 h/);
  });

  it('offers an accessible list view', async () => {
    render(<GraphView graph={robotGraph} mastery={{}} />);
    await userEvent.click(screen.getByRole('button', { name: /list view/i }));
    const list = screen.getByRole('list', { name: /concepts in order/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(robotGraph.concepts.length);
  });

  it('can highlight a subset of nodes', () => {
    render(<GraphView graph={robotGraph} mastery={{}} highlight={['robotics/servo-control']} />);
    expect(screen.getByRole('button', { name: /servo control/i })).toHaveAttribute('data-highlighted', 'true');
    expect(screen.getByRole('button', { name: /pwm/i })).toHaveAttribute('data-highlighted', 'false');
  });
});

describe('GraphSkeleton', () => {
  it('announces that the graph is loading', () => {
    render(<GraphSkeleton />);
    expect(screen.getByRole('status')).toHaveTextContent(/growing your map/i);
  });
});
