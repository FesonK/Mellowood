import type { ChatMessage, GoalSummary } from '@/ai/types';

export type GoalStatus = 'draft' | 'confirmed' | 'active';

export interface Goal {
  id: string;
  status: GoalStatus;
  summary: GoalSummary;
  messages: ChatMessage[];
  createdAt: string;
}
