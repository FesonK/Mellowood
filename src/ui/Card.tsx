import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  eyebrow?: ReactNode;
}

export function Card({ title, eyebrow, className, children, ...rest }: CardProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className={cn('glass rounded-blob p-6 shadow-soft sm:p-8', className)}
      {...rest}
    >
      {eyebrow && <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.2em] text-berry">{eyebrow}</p>}
      {title && (
        <h2 id={headingId} className="mb-4 text-2xl font-semibold">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
