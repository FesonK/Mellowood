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
}
