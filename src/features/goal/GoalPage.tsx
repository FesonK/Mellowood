import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useServices } from '@/app/services';
import type { GoalSummary } from '@/ai/types';
import { GoalChat } from './GoalChat';

export function GoalPage() {
  const { ai } = useServices();
  const [params] = useSearchParams();
  const [, setSummary] = useState<GoalSummary | null>(null);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-berry">Let&apos;s shape your goal</p>
        <h1 className="mt-1 text-3xl font-semibold">Chat with Mellow</h1>
      </header>
      <GoalChat ai={ai} initialGoal={params.get('q') ?? ''} onSummary={(s) => setSummary(s)} />
    </div>
  );
}
