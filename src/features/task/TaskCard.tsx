import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { TaskContent } from '@/ai/types';
import type { ConceptGraph, MasteryMap } from '@/domain/graph/types';
import type { Framing, TaskPlan } from '@/domain/strategy/strategy';
import { MAX_DIFFICULTY } from '@/domain/strategy/strategy';
import { GraphView } from '@/features/graph/GraphView';
import { Badge, cn, MasteryRing, type BadgeTone } from '@/ui';

const FRAMING_STYLE: Record<Framing, { tone: BadgeTone; emoji: string; label: string }> = {
  build: { tone: 'mint', emoji: '🛠️', label: 'Build' },
  investigate: { tone: 'sky', emoji: '🔍', label: 'Investigate' },
  fix: { tone: 'peach', emoji: '🩹', label: 'Fix' },
  challenge: { tone: 'butter', emoji: '⚡', label: 'Challenge' },
};

interface TaskCardProps {
  task: TaskContent;
  plan: TaskPlan;
  graph: ConceptGraph;
  mastery: MasteryMap;
  /** Extra controls (start/resume, hints, feedback) rendered under the checklist. */
  children?: ReactNode;
}

export function TaskCard({ task, plan, graph, mastery, children }: TaskCardProps) {
  const [checked, setChecked] = useState<boolean[]>(() => task.doneWhen.map(() => false));
  const concept = graph.concepts.find((c) => c.id === plan.conceptId);
  const framing = FRAMING_STYLE[plan.framing];
  const highlight = [plan.conceptId, ...(concept?.prerequisites ?? [])];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    >
      <div className="glass relative overflow-hidden rounded-blob p-6 shadow-soft sm:p-8">
        <span aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blush/40 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-2">
          <Badge tone={framing.tone}>
            <span aria-hidden>{framing.emoji}</span> {framing.label}
          </Badge>
          {plan.reason === 'revisit' && <Badge tone="lavender">A quick revisit</Badge>}
          <span
            role="img"
            aria-label={`Difficulty ${plan.difficulty} of ${MAX_DIFFICULTY}`}
            className="ml-auto flex gap-1"
          >
            {Array.from({ length: MAX_DIFFICULTY }, (_, i) => (
              <span key={i} className={cn('h-2.5 w-2.5 rounded-full', i < plan.difficulty ? 'bg-berry' : 'bg-lavender/30')} />
            ))}
          </span>
        </div>

        <h2 className="relative mt-4 text-3xl font-semibold leading-tight">{task.hook}</h2>
        <p className="relative mt-3 text-lg text-ink-soft">{task.story}</p>

        <h3 className="mt-6 text-sm font-extrabold uppercase tracking-wider text-ink-soft">Steps</h3>
        <ol aria-label="Steps" className="mt-2 flex flex-col gap-2">
          {task.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lavender/40 font-display text-sm font-semibold">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <h3 className="mt-6 text-sm font-extrabold uppercase tracking-wider text-ink-soft">Done when</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {task.doneWhen.map((item, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-center gap-3 rounded-squish bg-surface/60 px-3 py-2 transition hover:bg-surface">
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
                  className="h-5 w-5 accent-berry"
                />
                <span className={cn(checked[i] && 'text-ink-soft line-through')}>{item}</span>
              </label>
            </li>
          ))}
        </ul>
        {children && <div className="relative mt-6">{children}</div>}
      </div>

      <aside aria-label="Where this task sits on your map" className="flex flex-col gap-3">
        {concept && (
          <div className="glass flex items-center gap-4 rounded-blob p-4 shadow-soft">
            <MasteryRing value={mastery[concept.id] ?? 0} label={concept.name} />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-ink-soft">Growing</p>
              <p className="font-display text-lg font-semibold">{concept.name}</p>
            </div>
          </div>
        )}
        <p className="text-sm font-extrabold uppercase tracking-wider text-ink-soft">On your map</p>
        <GraphView graph={graph} mastery={mastery} highlight={highlight} compact />
      </aside>
    </motion.article>
  );
}
