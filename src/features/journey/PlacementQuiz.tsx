import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ConceptGraph, MasteryMap } from '@/domain/graph/types';
import { answer, createPlacement, maxQuestions, nextQuestion, placementResult } from '@/domain/placement/placement';
import { Button, Card, Mascot } from '@/ui';

export interface PlacementOutcome {
  mastery: MasteryMap;
  weeklyHours: number;
}

interface PlacementQuizProps {
  graph: ConceptGraph;
  onComplete: (outcome: PlacementOutcome) => void;
  /** Rendered under the hours step, e.g. a "Start me from scratch" shortcut. */
  extraActions?: (weeklyHours: number) => React.ReactNode;
}

export function PlacementQuiz({ graph, onComplete, extraActions }: PlacementQuizProps) {
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [step, setStep] = useState<'hours' | 'questions'>('hours');
  const [state, setState] = useState(() => createPlacement(graph));
  const byId = useMemo(() => new Map(graph.concepts.map((c) => [c.id, c])), [graph]);

  const questionId = nextQuestion(state);
  const concept = questionId ? byId.get(questionId) : undefined;

  const respond = (knows: boolean) => {
    const next = answer(state, knows);
    setState(next);
    if (!nextQuestion(next)) onComplete({ mastery: placementResult(next), weeklyHours });
  };

  if (step === 'hours') {
    return (
      <Card title="How much time do you have?" eyebrow="Step 1 of 2" className="mx-auto max-w-xl text-center">
        <Mascot mood="happy" size={88} className="mx-auto" />
        <label htmlFor="weekly-hours" className="mt-4 block font-semibold text-ink-soft">
          Hours a week I can spend
        </label>
        <p className="font-display text-5xl font-bold text-berry" aria-hidden>
          {weeklyHours}
          <span className="text-xl text-ink-soft"> h</span>
        </p>
        <input
          id="weekly-hours"
          type="range"
          min={1}
          max={30}
          value={weeklyHours}
          onChange={(e) => setWeeklyHours(Number(e.target.value))}
          className="mt-3 w-full accent-berry"
        />
        <div className="mt-6 flex flex-col items-center gap-3">
          <Button size="lg" onClick={() => setStep('questions')}>
            Continue
          </Button>
          {extraActions?.(weeklyHours)}
        </div>
      </Card>
    );
  }

  if (!concept) return null;

  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="mb-3 text-sm font-bold text-ink-soft">
        Question {state.asked + 1} of at most {maxQuestions(state)}
      </p>
      <AnimatePresence mode="wait">
        <motion.div
          key={concept.id}
          initial={{ opacity: 0, x: 40, rotate: 2 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          exit={{ opacity: 0, x: -40, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <Card eyebrow="Step 2 of 2">
            <Mascot mood="thinking" size={72} className="mx-auto" float={false} />
            <h2 className="mt-3 text-2xl font-semibold">Do you already know {concept.name}?</h2>
            <p className="mt-2 text-ink-soft">{concept.summary}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button size="lg" onClick={() => respond(true)}>
                I know it
              </Button>
              <Button size="lg" variant="secondary" onClick={() => respond(false)}>
                Not yet
              </Button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
