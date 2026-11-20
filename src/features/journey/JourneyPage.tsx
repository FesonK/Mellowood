import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useServices } from '@/app/services';
import { useAuth } from '@/auth/AuthContext';
import type { Goal } from '@/domain/goal';
import { GraphCache } from '@/domain/graph/graphCache';
import { generateValidGraph, GraphGenerationError } from '@/domain/graph/graphService';
import { saveMastery } from '@/domain/mastery/masteryStore';
import { Button, Card, Mascot } from '@/ui';
import { PlacementQuiz, type PlacementOutcome } from './PlacementQuiz';

type Phase = 'loading' | 'not-found' | 'generating' | 'error' | 'placement' | 'overview';

export function JourneyPage() {
  const { goalId = '' } = useParams();
  const { repo, ai } = useServices();
  const { user } = useAuth();
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

  const finishPlacement = async ({ mastery, weeklyHours }: PlacementOutcome, skipped = false) => {
    if (!user || !goal) return;
    const next: Goal = {
      ...goal,
      placement: { mastery, weeklyHours, skipped, completedAt: new Date().toISOString() },
    };
    await repo.put(user.id, 'goals', next);
    await saveMastery(repo, user.id, mastery);
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
  if (phase === 'generating') return <CenteredMascot mood="thinking" text="Mellow is mapping out your path…" />;
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
        <PlacementQuiz graph={goal.graph} onComplete={(o) => void finishPlacement(o)} />
      </div>
    );

  return (
    <Card title={goal.summary.title} eyebrow="Your path is ready">
      <p className="text-ink-soft">Overview coming right up.</p>
    </Card>
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
