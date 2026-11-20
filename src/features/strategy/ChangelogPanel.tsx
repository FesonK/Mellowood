import type { ChangelogEntry } from '@/domain/strategy/strategy';
import { Card } from '@/ui';

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export function ChangelogPanel({ entries }: { entries: ChangelogEntry[] }) {
  const newestFirst = [...entries].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Card title="How your plan changed" eyebrow="Mellow is listening">
      {newestFirst.length === 0 ? (
        <p className="text-ink-soft">No changes yet. Mellow is still getting to know you.</p>
      ) : (
        <ol aria-label="How your plan changed" className="relative ml-2 flex flex-col gap-4 border-l-2 border-dashed border-lavender/60 pl-5">
          {newestFirst.map((e, i) => (
            <li key={`${e.at}-${i}`} className="relative">
              <span aria-hidden className="absolute -left-[29px] top-1 h-4 w-4 rounded-full bg-gradient-to-br from-blush to-lavender shadow-soft" />
              <p className="font-semibold">{e.message}</p>
              <time dateTime={e.at} className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                {formatDay(e.at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
