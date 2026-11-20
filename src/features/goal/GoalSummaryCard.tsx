import { motion } from 'framer-motion';
import type { GoalSummary } from '@/ai/types';
import { Badge, Button, Card } from '@/ui';

interface GoalSummaryCardProps {
  summary: GoalSummary;
  onConfirm: (summary: GoalSummary) => void;
  onRevise: () => void;
  busy?: boolean;
}

export function GoalSummaryCard({ summary, onConfirm, onRevise, busy }: GoalSummaryCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
      <Card title="Your goal" eyebrow="Here's what I heard" className="relative overflow-hidden">
        <span aria-hidden className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-butter/60 blur-xl" />
        <p className="text-xl font-semibold leading-snug text-ink">{summary.endGoal}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="lavender">{summary.domain}</Badge>
        </div>
        <h3 className="mt-5 text-sm font-extrabold uppercase tracking-wider text-ink-soft">Constraints</h3>
        {summary.constraints.length ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {summary.constraints.map((c) => (
              <li key={c}>
                <Badge tone="mint">{c}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">No constraints yet, so we&apos;ll keep things flexible.</p>
        )}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="flex-1" loading={busy} onClick={() => onConfirm(summary)}>
            Looks right!
          </Button>
          <Button size="lg" variant="secondary" className="flex-1" onClick={onRevise} disabled={busy}>
            Not quite
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
