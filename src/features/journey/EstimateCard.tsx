import { MASTERED } from '@/domain/graph/algorithms';
import type { ConceptGraph, MasteryMap } from '@/domain/graph/types';
import { estimateTimeToLearn, formatEstimate } from '@/domain/estimate/estimate';
import { Badge, Card } from '@/ui';

interface EstimateCardProps {
  graph: ConceptGraph;
  mastery: MasteryMap;
  weeklyHours: number;
}

export function EstimateCard({ graph, mastery, weeklyHours }: EstimateCardProps) {
  const estimate = estimateTimeToLearn(graph, mastery, weeklyHours);
  const toGrow = graph.concepts.filter((c) => (mastery[c.id] ?? 0) < MASTERED).length;
  return (
    <Card title="Time to learn" eyebrow="Just for you">
      <p className="font-display text-3xl font-semibold leading-tight text-berry">{formatEstimate(estimate, weeklyHours)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="mint">{toGrow} concepts to grow</Badge>
        <Badge tone="butter">≈ {Math.ceil(estimate.remainingHours)} h focused learning</Badge>
        <Badge tone="sky">{weeklyHours} h / week</Badge>
      </div>
    </Card>
  );
}
