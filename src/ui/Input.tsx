import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = `${inputId}-desc`;
  const description = error ?? hint;
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={inputId} className="pl-2 text-sm font-bold text-ink-soft">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'h-12 rounded-squish border-2 bg-surface/80 px-4 text-ink placeholder:text-ink-soft/60',
          'transition focus:border-lavender focus:shadow-glow focus:outline-none',
          error ? 'border-berry/70' : 'border-lavender/30',
          className,
        )}
        {...rest}
      />
      {description && (
        <p id={descId} className={cn('pl-2 text-sm', error ? 'font-semibold text-berry' : 'text-ink-soft')}>
          {description}
        </p>
      )}
    </div>
  );
});
