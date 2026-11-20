import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useServices } from '@/app/services';
import { useAuth } from '@/auth/AuthContext';
import type { Goal } from '@/domain/goal';
import type { MasteryMap } from '@/domain/graph/types';
import { loadMastery } from '@/domain/mastery/masteryStore';
import { advance, createStrategy, nextTask } from '@/domain/strategy/strategy';
import { loadStrategy, saveStrategy } from '@/domain/strategy/strategyStore';
import { loadCurrentTask, saveCurrentTask, type CurrentTask } from '@/domain/currentTask';
import { Confetti, Mascot } from '@/ui';
import { TaskCard } from './TaskCard';

type State =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'finished'; goal: Goal }
  | { kind: 'error' }
  | { kind: 'ready'; goal: Goal; task: CurrentTask; mastery: MasteryMap };

export function TaskPage() {
  const { goalId = '' } = useParams();
  const { repo, ai } = useServices();
  const { user } = useAuth();
  const location = useLocation();
  const celebrate = Boolean((location.state as { celebrate?: boolean } | null)?.celebrate);
  const [state, setState] = useState<State>({ kind: 'loading' });
  const started = useRef(false);

  useEffect(() => {
    if (!user || started.current) return;
    started.current = true;
    void (async () => {
      const goal = await repo.get<Goal>(user.id, 'goals', goalId);
      if (!goal?.graph) return setState({ kind: 'missing' });
      const mastery = await loadMastery(repo, user.id);
      const existing = await loadCurrentTask(repo, user.id, goalId);
      if (existing) return setState({ kind: 'ready', goal, task: existing, mastery });

      const strategy =
        (await loadStrategy(repo, user.id, goalId, goal.graph, mastery)) ?? createStrategy(goalId, goal.graph, mastery);
      const plan = nextTask(strategy);
      if (!plan) return setState({ kind: 'finished', goal });
      const concept = goal.graph.concepts.find((c) => c.id === plan.conceptId)!;
      try {
        const content = await ai.generateTask({ plan, concept, goal: goal.summary });
        const task: CurrentTask = { id: goalId, goalId, plan, content, createdAt: new Date().toISOString() };
        await saveCurrentTask(repo, user.id, task);
        await saveStrategy(repo, user.id, advance(strategy, plan));
        setState({ kind: 'ready', goal, task, mastery });
      } catch {
        setState({ kind: 'error' });
      }
    })();
  }, [ai, goalId, repo, user]);

  if (state.kind === 'loading')
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status">
        <Mascot mood="thinking" size={100} />
        <p className="font-semibold text-ink-soft">Mellow is dreaming up your next adventure…</p>
      </div>
    );
  if (state.kind === 'missing' || state.kind === 'error')
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <Mascot mood="sleepy" size={100} />
        <p className="font-semibold text-ink-soft">
          {state.kind === 'missing' ? "Mellow couldn't find this goal." : 'Mellow got a bit tangled. Try again?'}
        </p>
        <Link to="/" className="font-bold text-berry hover:underline">
          Back home
        </Link>
      </div>
    );
  if (state.kind === 'finished')
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <Confetti />
        <Mascot mood="cheering" size={140} />
        <h1 className="text-4xl font-bold">You did it!</h1>
        <p className="text-ink-soft">Every concept for “{state.goal.summary.title}” is mastered. 🌸</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      {celebrate && <Confetti />}
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-berry">{state.goal.summary.title}</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink-soft">Your next adventure</h1>
        </div>
        <Link to={`/goal/${goalId}`} className="text-sm font-bold text-berry hover:underline">
          See the whole map
        </Link>
      </header>
      <TaskCard task={state.task.content} plan={state.task.plan} graph={state.goal.graph!} mastery={state.mastery} />
    </div>
  );
}
