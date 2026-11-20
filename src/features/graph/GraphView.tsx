import { useId, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MASTERED, topoSort } from '@/domain/graph/algorithms';
import type { Concept, ConceptGraph, MasteryMap } from '@/domain/graph/types';
import { clamp01 } from '@/lib/math';
import { Badge, Button, cn, ProgressRing } from '@/ui';
import { layoutGraph } from './layout';

const NODE_W = 168;
const NODE_H = 64;

interface GraphViewProps {
  graph: ConceptGraph;
  mastery: MasteryMap;
  /** When set, other nodes are dimmed (e.g. a task's target and its prerequisites). */
  highlight?: string[];
  compact?: boolean;
}

const masteryLabel = (m: number) => (m >= MASTERED ? 'mastered!' : `${Math.round(m * 100)}% mastered`);

export function GraphView({ graph, mastery, highlight, compact = false }: GraphViewProps) {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [selected, setSelected] = useState<string | null>(null);
  const layout = useMemo(
    () => layoutGraph(graph, { nodeWidth: NODE_W, nodeHeight: NODE_H, gapX: compact ? 16 : 28, gapY: compact ? 36 : 56 }),
    [graph, compact],
  );
  const byId = useMemo(() => new Map(graph.concepts.map((c) => [c.id, c])), [graph]);
  const highlighted = highlight ? new Set(highlight) : null;
  const selectedConcept = selected ? byId.get(selected) : undefined;

  return (
    <div className="flex flex-col gap-4">
      {!compact && (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant={view === 'map' ? 'secondary' : 'ghost'} aria-pressed={view === 'map'} onClick={() => setView('map')}>
            Map view
          </Button>
          <Button size="sm" variant={view === 'list' ? 'secondary' : 'ghost'} aria-pressed={view === 'list'} onClick={() => setView('list')}>
            List view
          </Button>
        </div>
      )}

      {view === 'map' ? (
        <div className="glass overflow-x-auto rounded-blob shadow-soft">
          <div role="group" aria-label="Concept map" className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
            <svg aria-hidden width={layout.width} height={layout.height} className="absolute inset-0">
              {layout.edges.map((e) => {
                const dim = highlighted && !(highlighted.has(e.from) && highlighted.has(e.to));
                const done = (mastery[e.from] ?? 0) >= MASTERED;
                return (
                  <motion.path
                    key={`${e.from}->${e.to}`}
                    d={e.path}
                    fill="none"
                    strokeWidth={3}
                    strokeLinecap="round"
                    stroke={done ? 'rgb(var(--mint))' : 'rgb(var(--lavender))'}
                    strokeDasharray={done ? undefined : '6 8'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: dim ? 0.25 : 0.9 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                );
              })}
            </svg>
            {graph.concepts.map((concept, i) => {
              const pos = layout.nodes[concept.id];
              if (!pos) return null;
              return (
                <ConceptNode
                  key={concept.id}
                  concept={concept}
                  mastery={clamp01(mastery[concept.id] ?? 0)}
                  x={pos.x}
                  y={pos.y}
                  index={i}
                  selected={selected === concept.id}
                  highlighted={highlighted ? highlighted.has(concept.id) : null}
                  onSelect={() => setSelected((s) => (s === concept.id ? null : concept.id))}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <ol aria-label="Concepts in order" className="flex flex-col gap-2">
          {topoSort(graph).map((id, i) => {
            const c = byId.get(id)!;
            const m = clamp01(mastery[id] ?? 0);
            return (
              <li key={id} className="glass flex items-center gap-4 rounded-squish px-4 py-3 shadow-soft">
                <span className="font-display text-lg font-semibold text-ink-soft">{i + 1}</span>
                <div className="flex-1">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-ink-soft">{c.summary}</p>
                </div>
                <ProgressRing value={m} label={`${c.name} mastery`} size={44} stroke={6} />
              </li>
            );
          })}
        </ol>
      )}

      <AnimatePresence>{selectedConcept && <ConceptDetails concept={selectedConcept} mastery={mastery[selectedConcept.id] ?? 0} />}</AnimatePresence>
    </div>
  );
}

interface ConceptNodeProps {
  concept: Concept;
  mastery: number;
  x: number;
  y: number;
  index: number;
  selected: boolean;
  highlighted: boolean | null;
  onSelect: () => void;
}

function ConceptNode({ concept, mastery, x, y, index, selected, highlighted, onSelect }: ConceptNodeProps) {
  const mastered = mastery >= MASTERED;
  return (
    <motion.button
      type="button"
      aria-label={`${concept.name}, ${masteryLabel(mastery)}`}
      aria-pressed={selected}
      data-highlighted={highlighted === null ? undefined : String(highlighted)}
      onClick={onSelect}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: highlighted === false ? 0.4 : 1, scale: 1 }}
      whileHover={{ y: -3, scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: index * 0.04 }}
      className={cn(
        'absolute flex items-center gap-2 overflow-hidden rounded-squish border-2 bg-surface px-3 text-left shadow-soft',
        selected ? 'border-berry' : highlighted ? 'border-tangerine' : 'border-white/70',
      )}
      style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
    >
      {/* liquid fill rises with mastery */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-mint/80 to-sky/50 transition-[height] duration-700 ease-out"
        style={{ height: `${Math.round(mastery * 100)}%` }}
      />
      <span className="relative line-clamp-2 flex-1 text-sm font-bold leading-tight text-ink">{concept.name}</span>
      {mastered && (
        <span aria-hidden className="relative animate-wiggle text-lg">
          ✨
        </span>
      )}
    </motion.button>
  );
}

function ConceptDetails({ concept, mastery }: { concept: Concept; mastery: number }) {
  const headingId = useId();
  return (
    <motion.section
      aria-labelledby={headingId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="glass flex items-center gap-5 rounded-blob p-5 shadow-soft"
    >
      <ProgressRing value={mastery} label={`${concept.name} mastery`} size={64} />
      <div className="flex-1">
        <h3 id={headingId} className="text-xl font-semibold">
          {concept.name}
        </h3>
        <p className="text-ink-soft">{concept.summary}</p>
        <div className="mt-2 flex gap-2">
          <Badge tone="butter">≈ {concept.hours} h</Badge>
          {concept.prerequisites.length === 0 && <Badge tone="mint">Great place to start</Badge>}
        </div>
      </div>
    </motion.section>
  );
}

export function GraphSkeleton() {
  return (
    <div role="status" className="flex flex-col items-center gap-4">
      <span className="sr-only">Growing your map…</span>
      <div aria-hidden className="grid w-full max-w-3xl gap-6">
        {[2, 3, 2, 1].map((n, row) => (
          <div key={row} className="flex justify-center gap-6">
            {Array.from({ length: n }, (_, i) => (
              <span key={i} className="skeleton h-16 w-40" />
            ))}
          </div>
        ))}
      </div>
      <p aria-hidden className="font-semibold text-ink-soft">
        Growing your map…
      </p>
    </div>
  );
}
