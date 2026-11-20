import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { TaskReflection } from '@/domain/completeTask';
import type { SelfAssessment } from '@/domain/mastery/updateMastery';
import { REFLECTION_CHIPS, type ReflectionChipId } from '@/domain/strategy/reflection';
import { Button, cn } from '@/ui';

const OUTCOMES: { id: SelfAssessment; label: string; emoji: string }[] = [
  { id: 'nailed', label: 'I nailed it', emoji: '🌟' },
  { id: 'mostly', label: 'Mostly', emoji: '🙂' },
  { id: 'struggled', label: 'Struggled', emoji: '🌧️' },
];

interface ReflectionFormProps {
  onSubmit: (reflection: TaskReflection) => void;
  busy?: boolean;
}

export function ReflectionForm({ onSubmit, busy }: ReflectionFormProps) {
  const [outcome, setOutcome] = useState<SelfAssessment | null>(null);
  const [chips, setChips] = useState<ReflectionChipId[]>([]);
  const [liked, setLiked] = useState('');
  const [disliked, setDisliked] = useState('');
  const [strategyChange, setStrategyChange] = useState('');

  const toggle = (id: ReflectionChipId) => setChips((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!outcome) return;
    onSubmit({ outcome, chips, liked: liked.trim(), disliked: disliked.trim(), strategyChange: strategyChange.trim() });
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex flex-col gap-6 rounded-blob p-6 shadow-soft sm:p-8"
    >
      <div>
        <h2 className="text-2xl font-semibold">How did it go?</h2>
        <p className="text-ink-soft">Be honest, there are no wrong answers. Mellow uses this to shape what comes next.</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-extrabold uppercase tracking-wider text-ink-soft">I…</legend>
        <div role="radiogroup" className="grid grid-cols-3 gap-3">
          {OUTCOMES.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={outcome === o.id}
              onClick={() => setOutcome(o.id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-squish border-2 bg-surface/70 px-3 py-4 font-bold transition hover:-translate-y-0.5',
                outcome === o.id ? 'border-berry shadow-glow' : 'border-transparent',
              )}
            >
              <span aria-hidden className="text-2xl">
                {o.emoji}
              </span>
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <p className="mb-2 text-sm font-extrabold uppercase tracking-wider text-ink-soft">Next time, I'd like…</p>
        <div className="flex flex-wrap gap-2">
          {REFLECTION_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              aria-pressed={chips.includes(chip.id)}
              onClick={() => toggle(chip.id)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-bold transition',
                chips.includes(chip.id) ? 'bg-lavender text-ink shadow-pop' : 'bg-surface/70 text-ink-soft hover:bg-surface',
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <NoteField id="liked" label="What did you like?" value={liked} onChange={setLiked} />
        <NoteField id="disliked" label="What didn't you like?" value={disliked} onChange={setDisliked} />
        <NoteField id="change" label="How should your plan change?" value={strategyChange} onChange={setStrategyChange} />
      </div>

      <Button type="submit" size="lg" disabled={!outcome} loading={busy} className="self-end">
        Finish task
      </Button>
    </motion.form>
  );
}

function NoteField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`reflection-${id}`} className="pl-2 text-sm font-bold text-ink-soft">
        {label}
      </label>
      <textarea
        id={`reflection-${id}`}
        rows={3}
        maxLength={500}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="resize-none rounded-squish border-2 border-lavender/30 bg-surface/80 px-4 py-3 focus:border-lavender focus:shadow-glow focus:outline-none"
      />
    </div>
  );
}
