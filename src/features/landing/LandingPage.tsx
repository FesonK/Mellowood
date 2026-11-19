import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Mascot } from '@/ui';

export const EXAMPLE_GOALS = [
  'Build a robot arm that sorts Lego',
  'Make a chatbot for my bakery',
  'Play my favourite song on guitar',
  'Paint a cozy watercolour landscape',
  'Ship my first iPhone app',
  'Bake sourdough bread from scratch',
];

export const ROTATE_MS = 3000;

const SPARKLES = [
  { className: 'left-[6%] top-[18%] bg-butter', delay: '0s' },
  { className: 'right-[8%] top-[12%] bg-sky', delay: '.7s' },
  { className: 'left-[14%] bottom-[16%] bg-mint', delay: '1.4s' },
  { className: 'right-[16%] bottom-[22%] bg-blush', delay: '2.1s' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setExampleIndex((i) => (i + 1) % EXAMPLE_GOALS.length), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const trimmed = goal.trim();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed) return;
    navigate(`/goal/new?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative flex min-h-[78vh] flex-col items-center justify-center text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {SPARKLES.map((s, i) => (
          <span
            key={i}
            className={`absolute h-20 w-20 animate-float rounded-full opacity-70 blur-2xl ${s.className}`}
            style={{ animationDelay: s.delay }}
          />
        ))}
      </div>

      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 14 }}>
        <Mascot mood="cheering" size={150} />
      </motion.div>

      <motion.h1
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-6 max-w-2xl text-balance text-4xl font-bold leading-tight sm:text-6xl"
      >
        What do you want to{' '}
        <span className="bg-gradient-to-r from-berry via-peach to-lavender bg-clip-text text-transparent">learn</span>?
      </motion.h1>
      <p className="mt-4 max-w-lg text-lg text-ink-soft">
        Tell Mellow your dream project. We&apos;ll grow a cozy, step-by-step path that fits you.
      </p>

      <form onSubmit={submit} className="glass mt-10 flex w-full max-w-2xl items-center gap-2 rounded-full p-2 pl-6 shadow-soft transition focus-within:shadow-glow">
        <label htmlFor="landing-goal" className="sr-only">
          What do you want to learn?
        </label>
        <span aria-hidden className="text-2xl">🌱</span>
        <input
            id="landing-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={EXAMPLE_GOALS[exampleIndex]}
            autoComplete="off"
            autoFocus
            className="h-14 min-w-0 flex-1 bg-transparent text-lg text-ink placeholder:text-ink-soft/50 focus:outline-none"
        />
        <Button type="submit" size="lg" disabled={!trimmed}>
          Let&apos;s go
        </Button>
      </form>

      <ul className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2" aria-label="Example goals">
        {EXAMPLE_GOALS.map((example) => (
          <li key={example}>
            <button
              type="button"
              onClick={() => setGoal(example)}
              className="rounded-full bg-surface/70 px-4 py-2 text-sm font-semibold text-ink-soft shadow-soft transition hover:-translate-y-0.5 hover:bg-surface hover:text-ink"
            >
              {example}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
