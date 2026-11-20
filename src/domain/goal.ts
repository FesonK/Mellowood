import type { ChatMessage, GoalSummary } from '@/ai/types';
import type { ConceptGraph, MasteryMap } from '@/domain/graph/types';

export type GoalStatus = 'draft' | 'confirmed' | 'active';

export interface Placement {
  mastery: MasteryMap;
  weeklyHours: number;
  skipped: boolean;
  completedAt: string;
}

export interface Goal {
  id: string;
  status: GoalStatus;
  summary: GoalSummary;
  messages: ChatMessage[];
  createdAt: string;
  graph?: ConceptGraph;
  placement?: Placement;
}
