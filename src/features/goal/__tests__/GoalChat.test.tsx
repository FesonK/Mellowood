import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalChat } from '../GoalChat';
import type { AIProvider, ClarifyResult } from '@/ai/types';

function scriptedAI(results: ClarifyResult[]): AIProvider {
  let i = 0;
  return {
    clarifyGoal: vi.fn(async () => results[Math.min(i++, results.length - 1)]),
  } as unknown as AIProvider;
}

const summary = { title: 'Robot arm', endGoal: 'Build a robot arm', domain: 'Robotics', constraints: [] };

describe('GoalChat', () => {
  it('sends the initial goal and shows the follow-up question', async () => {
    const ai = scriptedAI([{ kind: 'question', question: 'What do you want to build?' }]);
    render(<GoalChat ai={ai} initialGoal="learn AI" onSummary={vi.fn()} />);
    expect(screen.getByText('learn AI')).toBeInTheDocument();
    expect(await screen.findByText('What do you want to build?')).toBeInTheDocument();
  });

  it('shows a typing indicator while Mellow is thinking', async () => {
    let resolve!: (r: ClarifyResult) => void;
    const ai = { clarifyGoal: () => new Promise<ClarifyResult>((r) => (resolve = r)) } as unknown as AIProvider;
    render(<GoalChat ai={ai} initialGoal="learn AI" onSummary={vi.fn()} />);
    expect(await screen.findByRole('status', { name: /mellow is typing/i })).toBeInTheDocument();
    resolve({ kind: 'question', question: 'Tell me more?' });
    expect(await screen.findByText('Tell me more?')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: /mellow is typing/i })).not.toBeInTheDocument();
  });

  it('lets the user answer and hands back the summary', async () => {
    const onSummary = vi.fn();
    const ai = scriptedAI([
      { kind: 'question', question: 'What do you want to build?' },
      { kind: 'summary', summary, message: 'Got it!' },
    ]);
    render(<GoalChat ai={ai} initialGoal="learn robots" onSummary={onSummary} />);
    await screen.findByText('What do you want to build?');
    await userEvent.type(screen.getByLabelText(/your answer/i), 'a robot arm{Enter}');
    expect(await screen.findByText('a robot arm')).toBeInTheDocument();
    expect(await screen.findByText('Got it!')).toBeInTheDocument();
    expect(onSummary).toHaveBeenCalledWith(summary, expect.arrayContaining([{ role: 'user', content: 'a robot arm' }]));
  });

  it('does not send empty answers', async () => {
    const ai = scriptedAI([{ kind: 'question', question: 'Q?' }]);
    render(<GoalChat ai={ai} initialGoal="x" onSummary={vi.fn()} />);
    await screen.findByText('Q?');
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });
});
