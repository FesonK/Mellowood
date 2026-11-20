import { render, screen, within } from '@testing-library/react';
import { ChangelogPanel } from '../ChangelogPanel';

describe('ChangelogPanel', () => {
  it('lists changes newest first', () => {
    render(
      <ChangelogPanel
        entries={[
          { at: '2026-11-01T10:00:00.000Z', message: 'First change' },
          { at: '2026-11-02T10:00:00.000Z', message: 'Second change' },
        ]}
      />,
    );
    const items = within(screen.getByRole('list', { name: /how your plan changed/i })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Second change');
    expect(items[1]).toHaveTextContent('First change');
  });

  it('has a gentle empty state', () => {
    render(<ChangelogPanel entries={[]} />);
    expect(screen.getByText(/still getting to know you/i)).toBeInTheDocument();
  });
});
