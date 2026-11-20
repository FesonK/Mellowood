import type { Concept, ConceptGraph } from '@/domain/graph/types';
import type { TaskPlan } from '@/domain/strategy/strategy';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GoalSummary {
  /** Short label, at most 60 characters. */
  title: string;
  /** What the learner wants to be able to do or build when finished. */
  endGoal: string;
  domain: string;
  constraints: string[];
}

export type ClarifyResult =
  | { kind: 'question'; question: string }
  | { kind: 'summary'; summary: GoalSummary; message: string };

export const MAX_FOLLOW_UPS = 4;

/** Everything the app asks of a language model. Claude in production, a deterministic mock in tests. */
export interface AIProvider {
  clarifyGoal(messages: ChatMessage[]): Promise<ClarifyResult>;
  /** Dependency graph of concepts needed to reach the goal. May be imperfect; callers validate. */
  generateGraph(summary: GoalSummary): Promise<ConceptGraph>;
  /** Turn a strategy plan into an enticing, concrete task. */
  generateTask(input: TaskRequest): Promise<TaskContent>;
}

export interface TaskRequest {
  plan: TaskPlan;
  concept: Concept;
  goal: GoalSummary;
}

export interface TaskContent {
  /** A short, curiosity-sparking title. */
  hook: string;
  /** The problem framed as a little story tied to the learner's goal. */
  story: string;
  steps: string[];
  doneWhen: string[];
  /** Exactly three progressive hints, gentlest first. */
  hints: string[];
}
