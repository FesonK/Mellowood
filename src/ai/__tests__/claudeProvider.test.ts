import { AIError, ClaudeProvider, type InvokeAI } from '../claudeProvider';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';

describe('ClaudeProvider (via the `ai` edge function)', () => {
  it('sends clarifyGoal to the edge function and returns its result', async () => {
    const invoke: InvokeAI = vi.fn(async () => ({ data: { kind: 'question', question: 'What?' }, error: null }));
    const ai = new ClaudeProvider(invoke);
    const msgs = [{ role: 'user' as const, content: 'learn AI' }];
    expect(await ai.clarifyGoal(msgs)).toEqual({ kind: 'question', question: 'What?' });
    expect(invoke).toHaveBeenCalledWith('clarifyGoal', { messages: msgs });
  });

  it('returns graphs from generateGraph', async () => {
    const invoke: InvokeAI = async () => ({ data: robotGraph, error: null });
    const summary = { title: 't', endGoal: 'e', domain: 'd', constraints: [] };
    expect(await new ClaudeProvider(invoke).generateGraph(summary)).toEqual(robotGraph);
  });

  it('turns function errors into AIError', async () => {
    const invoke: InvokeAI = async () => ({ data: null, error: { message: 'boom' } });
    await expect(new ClaudeProvider(invoke).clarifyGoal([])).rejects.toBeInstanceOf(AIError);
  });

  it('rejects malformed payloads', async () => {
    const invoke: InvokeAI = async () => ({ data: { nope: true }, error: null });
    await expect(new ClaudeProvider(invoke).clarifyGoal([])).rejects.toBeInstanceOf(AIError);
  });
});
