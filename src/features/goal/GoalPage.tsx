import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useServices } from '@/app/services';
import { useAuth } from '@/auth/AuthContext';
import { randomId } from '@/auth/mockAuth';
import type { ChatMessage, GoalSummary } from '@/ai/types';
import type { Goal } from '@/domain/goal';
import { GoalChat } from './GoalChat';
import { GoalSummaryCard } from './GoalSummaryCard';

const REVISE_PROMPT: ChatMessage = {
  role: 'assistant',
  content: 'No problem! What should I change? Tell me in your own words.',
};

export function GoalPage() {
  const { ai, repo } = useServices();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [summary, setSummary] = useState<GoalSummary | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const [seed, setSeed] = useState<ChatMessage[]>([]);
  const [saving, setSaving] = useState(false);

  const confirm = async (confirmed: GoalSummary) => {
    if (!user) return;
    setSaving(true);
    const goal: Goal = {
      id: randomId(),
      status: 'confirmed',
      summary: confirmed,
      messages,
      createdAt: new Date().toISOString(),
    };
    await repo.put(user.id, 'goals', goal);
    navigate(`/goal/${goal.id}`);
  };

  const revise = () => {
    setSummary(null);
    setSeed([...messages, REVISE_PROMPT]);
    setChatKey((k) => k + 1);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-berry">Let&apos;s shape your goal</p>
        <h1 className="mt-1 text-3xl font-semibold">Chat with Mellow</h1>
      </header>
      <GoalChat
        key={chatKey}
        ai={ai}
        initialGoal={chatKey === 0 ? (params.get('q') ?? '') : undefined}
        initialMessages={seed}
        onMessagesChange={setMessages}
        onSummary={(s, all) => {
          setMessages(all);
          setSummary(s);
        }}
      />
      {summary && <GoalSummaryCard summary={summary} onConfirm={confirm} onRevise={revise} busy={saving} />}
    </div>
  );
}
