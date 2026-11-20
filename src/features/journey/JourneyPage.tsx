import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useServices } from '@/app/services';
import { useAuth } from '@/auth/AuthContext';
import type { Goal } from '@/domain/goal';
import { GraphCache } from '@/domain/graph/graphCache';
import { generateValidGraph, GraphGenerationError } from '@/domain/graph/graphService';
import { loadMastery, saveMastery } from '@/domain/mastery/masteryStore';
import { fromScratch, mergePlacement } from '@/domain/placement/placement';
import { createStrategy } from '@/domain/strategy/strategy';
import { saveStrategy } from '@/domain/strategy/strategyStore';
import { buildTrack } from '@/domain/track/track';
import { GraphSkeleton, GraphView } from '@/features/graph/GraphView';
import { Button, Mascot } from '@/ui';
import { EstimateCard } from './EstimateCard';
import { PlacementQuiz, type PlacementOutcome } from './PlacementQuiz';

type Phase = 'loading' | 'not-found' | 'generating' | 'error' | 'placement' | 'overview';

export function JourneyPage() {
  const { goalId = '' } = useParams();
  const { repo, ai } = useServices();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const cache = useMemo(() => new GraphCache(localStorage), []);

  const ensureGraph = useCallback(
    async (g: Goal) => {
      if (!user) return;
      if (g.graph) {
        setGoal(g);
        setPhase(g.placement ? 'overview' : 'placement');
        return;
      }
      setPhase('generating');
      try {
        const graph = await cache.getOrCreate(g.summary, () => generateValidGraph(ai, g.summary));
        const next = { ...g, graph };
        await repo.put(user.id, 'goals', next);
        setGoal(next);
        setPhase('placement');
      } catch (e) {
        setError(e instanceof GraphGenerationError ? e.message : 'Something went wrong.');
        setPhase('error');
      }
    },
    [ai, cache, repo, user],
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void repo.get<Goal>(user.id, 'goals', goalId).then((g) => {
      if (cancelled) return;
      if (!g) setPhase('not-found');
      else void ensureGraph(g);
    });
    return () => {
      cancelled = true;
    };
  }, [goalId, repo, user, ensureGraph]);

  const [joining, setJoining] = useState(false);

  /** Commit to the plan: build the custom track and a fresh strategy, then open the first task. */
  const join = async () => {
    if (!user || !goal?.graph) return;
    setJoining(true);
    const mastery = await loadMastery(repo, user.id);
    await repo.put(user.id, 'tracks', buildTrack(goal.id, goal.graph, mastery));
    await saveStrategy(repo, user.id, createStrategy(goal.id, goal.graph, mastery));
    const next: Goal = { ...goal, status: 'active' };
    await repo.put(user.id, 'goals', next);
    navigate(`/goal/${goal.id}/task`, { state: { celebrate: true } });
  };

  const finishPlacement = async ({ mastery, weeklyHours }: PlacementOutcome, skipped = false) => {
    if (!user || !goal) return;
    const merged = goal.placement ? mergePlacement(goal.placement.mastery, mastery) : mastery;
    const next: Goal = {
      ...goal,
      placement: { mastery: merged, weeklyHours, skipped, completedAt: new Date().toISOString() },
    };
    await repo.put(user.id, 'goals', next);
    // Mastery is global across goals: only ever raise it here, never wipe what was learned elsewhere.
    const existing = await loadMastery(repo, user.id);
    await saveMastery(repo, user.id, mergePlacement(existing, merged));
    setGoal(next);
    setPhase('overview');
  };

  if (phase === 'loading') return <CenteredMascot mood="sleepy" text="Opening your goal…" />;
  if (phase === 'not-found')
    return (
      <CenteredMascot mood="thinking" text="Hmm, Mellow couldn't find that goal.">
        <Link to="/" className="font-bold text-berry hover:underline">
          Start a new one
        </Link>
      </CenteredMascot>
    );
  if (phase === 'generating')
    return (
      <div className="flex flex-col items-center gap-6 pt-6">
        <Mascot mood="thinking" size={96} />
        <GraphSkeleton />
      </div>
    );
  if (phase === 'error' || !goal?.graph)
    return (
      <CenteredMascot mood="sleepy" text={error ?? 'Something went wrong.'}>
        <Button onClick={() => goal && void ensureGraph(goal)}>Try again</Button>
      </CenteredMascot>
    );
  if (phase === 'placement')
    return (
      <div>
        <h1 className="mb-6 text-center text-3xl font-semibold">Let&apos;s find your starting spot</h1>
        <PlacementQuiz
          graph={goal.graph}
          onComplete={(o) => void finishPlacement(o)}
          extraActions={(weeklyHours) => (
            <Button
              variant="ghost"
              onClick={() => void finishPlacement({ mastery: fromScratch(goal.graph!), weeklyHours }, true)}
            >
              Start me from scratch
            </Button>
          )}
        />
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-berry">Your path is ready</p>
        <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{goal.summary.title}</h1>
      </header>
      <EstimateCard graph={goal.graph} mastery={goal.placement?.mastery ?? {}} weeklyHours={goal.placement?.weeklyHours ?? 5} />
      <GraphView graph={goal.graph} mastery={goal.placement?.mastery ?? {}} />
      <div className="glass sticky bottom-4 z-20 flex flex-col items-center gap-3 rounded-blob p-4 shadow-soft sm:flex-row sm:justify-between">
        <Button variant="ghost" size="sm" onClick={() => setPhase('placement')}>
          Redo placement
        </Button>
        {goal.status === 'active' ? (
          <Link
            to={`/goal/${goal.id}/task`}
            className="inline-flex h-14 items-center rounded-full bg-gradient-to-br from-berry to-peach px-8 font-display text-lg font-semibold text-white shadow-pop transition hover:brightness-105"
          >
            Continue learning
          </Link>
        ) : (
          <Button size="lg" loading={joining} onClick={() => void join()}>
            Agree to join 🌱
          </Button>
        )}
      </div>
    </div>
  );
}

function CenteredMascot({
  mood,
  text,
  children,
}: {
  mood: 'happy' | 'thinking' | 'sleepy';
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center" aria-live="polite">
      <Mascot mood={mood} size={110} />
      <p className="text-lg font-semibold text-ink-soft">{text}</p>
      {children}
    </div>
  );
}
