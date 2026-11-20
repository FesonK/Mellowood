import type { ConceptGraph } from '@/domain/graph/types';
import type { AIProvider, ChatMessage, ClarifyResult, GoalSummary } from './types';

export class AIError extends Error {
  constructor(message = 'Mellow had trouble thinking. Please try again.') {
    super(message);
    this.name = 'AIError';
  }
}

/** Calls the `ai` Supabase Edge Function. Shape matches supabase.functions.invoke. */
export type InvokeAI = (
  action: string,
  payload: unknown,
) => Promise<{ data: unknown; error: { message: string } | null }>;

/**
 * Talks to Claude through the server-side `ai` edge function so the Anthropic API key never
 * reaches the browser. The function returns already-structured JSON.
 */
export class ClaudeProvider implements AIProvider {
  constructor(private readonly invoke: InvokeAI) {}

  private async call<T>(action: string, payload: unknown, isValid: (d: unknown) => d is T): Promise<T> {
    let result: Awaited<ReturnType<InvokeAI>>;
    try {
      result = await this.invoke(action, payload);
    } catch {
      throw new AIError();
    }
    if (result.error) throw new AIError();
    if (!isValid(result.data)) throw new AIError('Mellow sent back something unexpected.');
    return result.data;
  }

  clarifyGoal(messages: ChatMessage[]) {
    return this.call<ClarifyResult>('clarifyGoal', { messages }, isClarifyResult);
  }

  generateGraph(summary: GoalSummary) {
    return this.call<ConceptGraph>('generateGraph', { summary }, isGraphShape);
  }
}

const isObject = (d: unknown): d is Record<string, unknown> => typeof d === 'object' && d !== null;

function isClarifyResult(d: unknown): d is ClarifyResult {
  if (!isObject(d)) return false;
  if (d.kind === 'question') return typeof d.question === 'string';
  return d.kind === 'summary' && isObject(d.summary) && typeof d.message === 'string';
}

function isGraphShape(d: unknown): d is ConceptGraph {
  return isObject(d) && typeof d.goal === 'string' && Array.isArray(d.concepts);
}

/** Adapter from a Supabase client to InvokeAI. */
export const supabaseInvoker =
  (client: {
    functions: {
      invoke: (name: string, opts: { body: Record<string, unknown> }) => Promise<{ data: unknown; error: unknown }>;
    };
  }): InvokeAI =>
  async (action, payload) => {
    const { data, error } = await client.functions.invoke('ai', { body: { action, payload } });
    return { data, error: error ? { message: String((error as Error).message ?? error) } : null };
  };
