import { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['--berry', '--peach', '--lavender', '--mint', '--butter', '--sky'];

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** A soft, celebratory burst. Decorative only; skipped entirely for reduced-motion users. */
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        x: (Math.sin(i * 12.9898) * 43758.5453) % 1,
        delay: (i % 9) * 0.05,
        rotate: (i * 47) % 360,
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
      })),
    [pieces],
  );
  if (prefersReducedMotion()) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className={b.round ? 'absolute h-3 w-3 rounded-full' : 'absolute h-2 w-4 rounded-sm'}
          style={{ left: `${50 + b.x * 45}%`, top: '-2rem', background: `rgb(var(${b.color}))` }}
          initial={{ y: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: b.rotate + 360, opacity: [1, 1, 0] }}
          transition={{ duration: 2.4, delay: b.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
