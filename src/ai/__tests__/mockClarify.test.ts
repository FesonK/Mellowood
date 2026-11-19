import { MockAIProvider } from '../mockProvider';
import { MAX_FOLLOW_UPS, type ChatMessage } from '../types';

const ai = new MockAIProvider({ delayMs: 0 });
const user = (content: string): ChatMessage => ({ role: 'user', content });
const bot = (content: string): ChatMessage => ({ role: 'assistant', content });

describe('MockAIProvider.clarifyGoal', () => {
  it('asks about the end result when the goal is vague', async () => {
    const result = await ai.clarifyGoal([user('learn AI')]);
    expect(result.kind).toBe('question');
    if (result.kind === 'question') expect(result.question).toMatch(/build or do/i);
  });

  it('asks about constraints once the outcome is clear', async () => {
    const result = await ai.clarifyGoal([user('I want to build a robot arm that sorts Lego')]);
    expect(result.kind).toBe('question');
    if (result.kind === 'question') expect(result.question).toMatch(/hours|tools|budget/i);
  });

  it('summarises a specific goal with outcome and constraints', async () => {
    const result = await ai.clarifyGoal([
      user('I want to build a robot arm that sorts Lego by colour'),
      bot('Any constraints?'),
      user('About 5 hours a week, I have an Arduino and a laptop'),
    ]);
    expect(result.kind).toBe('summary');
    if (result.kind !== 'summary') return;
    expect(result.summary.endGoal).toMatch(/robot arm that sorts lego/i);
    expect(result.summary.domain).toBe('Robotics');
    expect(result.summary.constraints.join(' ')).toMatch(/5 hours a week/i);
    expect(result.summary.title.length).toBeLessThanOrEqual(60);
  });

  it('accepts the answer to the outcome question even without a keyword', async () => {
    const result = await ai.clarifyGoal([
      user('AI'),
      bot('When you are done, what do you want to be able to build or do?'),
      user('chatbots for my bakery, maybe 3 hours a week'),
    ]);
    expect(result.kind).toBe('summary');
    if (result.kind === 'summary') expect(result.summary.endGoal).toMatch(/chatbots for my bakery/i);
  });

  it(`stops asking after ${MAX_FOLLOW_UPS} follow-ups`, async () => {
    const messages: ChatMessage[] = [user('stuff')];
    for (let i = 0; i < MAX_FOLLOW_UPS; i++) messages.push(bot('?'), user('hmm'));
    expect((await ai.clarifyGoal(messages)).kind).toBe('summary');
  });

  it('is deterministic', async () => {
    const msgs = [user('learn guitar')];
    expect(await ai.clarifyGoal(msgs)).toEqual(await ai.clarifyGoal(msgs));
  });
});
