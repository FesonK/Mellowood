import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Mascot, type MascotMood } from '@/ui';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  mood?: MascotMood;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, mood = 'happy', children, footer }: AuthLayoutProps) {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-12">
      <FloatingDecor />
      <p className="mb-2 font-display text-lg font-semibold tracking-wide text-berry">Mellowood</p>
      <Mascot mood={mood} size={104} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="glass mt-4 w-full rounded-blob p-7 shadow-soft"
      >
        <h1 className="text-center text-3xl font-semibold">{title}</h1>
        <p className="mb-6 mt-1 text-center text-ink-soft">{subtitle}</p>
        {children}
      </motion.div>
      {footer && <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>}
    </main>
  );
}

function FloatingDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <span className="absolute left-[8%] top-[12%] h-24 w-24 animate-float rounded-full bg-blush/60 blur-xl" />
      <span className="absolute right-[10%] top-[30%] h-32 w-32 animate-float rounded-full bg-sky/60 blur-xl [animation-delay:1s]" />
      <span className="absolute bottom-[10%] left-[20%] h-28 w-28 animate-float rounded-full bg-mint/60 blur-xl [animation-delay:2s]" />
      <span className="absolute bottom-[18%] right-[18%] h-16 w-16 animate-float rounded-full bg-butter/70 blur-lg [animation-delay:.5s]" />
    </div>
  );
}
