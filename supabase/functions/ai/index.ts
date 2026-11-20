// Supabase Edge Function: the only place the Anthropic API key lives.
// Deploy:  supabase secrets set ANTHROPIC_API_KEY=...   &&   supabase functions deploy ai
// Supabase verifies the caller's JWT before this runs (verify_jwt defaults to true).
import Anthropic from 'npm:@anthropic-ai/sdk';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk/helpers/zod';
import { z } from 'npm:zod';

const MODEL = 'claude-opus-5-5';
const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ChatMessage = z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) });
const GoalSummary = z.object({
  title: z.string(),
  endGoal: z.string(),
  domain: z.string(),
  constraints: z.array(z.string()),
});

const ClarifyOutput = z.object({
  kind: z.enum(['question', 'summary']),
  question: z.string().describe('Follow-up question when kind = question, else empty'),
  message: z.string().describe('Short friendly lead-in when kind = summary, else empty'),
  summary: GoalSummary,
});

const GraphOutput = z.object({
  goal: z.string(),
  concepts: z.array(
    z.object({
      id: z.string().describe('Canonical lowercase slug like "linear-algebra/matrix-multiplication"'),
      name: z.string(),
      summary: z.string(),
      hours: z.number(),
      prerequisites: z.array(z.string()),
    }),
  ),
});

const VOICE =
  'You are Mellow, the warm, encouraging guide inside Mellowood, a cozy learning app. Be concise, kind and concrete.';

const CLARIFY_SYSTEM = `${VOICE}
You help a learner turn a wish ("learn AI") into a specific, achievable goal.
Ask at most one short follow-up question at a time, first about the concrete end result they want to build or do,
then about constraints (hours per week, tools, budget). After at most 4 assistant follow-ups, or as soon as the goal
is specific, return kind = "summary" with a title of at most 60 characters, the end goal, a domain label and the
constraints the learner mentioned (empty list if none). Never invent constraints.`;

const GRAPH_SYSTEM = `${VOICE}
Produce the dependency graph of concepts a learner needs to reach the goal. Rules:
- 6 to 14 concepts, each a teachable unit with realistic focused hours (0.5 to 12).
- ids are canonical, reusable slugs "<field>/<concept>" (lowercase, hyphens) so the same concept has the same id in any goal.
- prerequisites reference other ids in this graph only; no cycles.
- Exactly one final capstone concept with id "projects/<slug>" that is the learner's end goal, depending on the concepts that lead to it.`;

type Action = 'clarifyGoal' | 'generateGraph';

async function structured<T extends z.ZodTypeAny>(system: string, userContent: string, schema: T) {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: zodOutputFormat(schema) },
    system,
    messages: [{ role: 'user', content: userContent }],
  });
  if (response.stop_reason === 'refusal') throw new Error('refused');
  if (!response.parsed_output) throw new Error('unparseable');
  return response.parsed_output as z.infer<T>;
}

async function handle(action: Action, payload: unknown) {
  if (action === 'clarifyGoal') {
    const { messages } = z.object({ messages: z.array(ChatMessage).max(20) }).parse(payload);
    const transcript = messages.map((m) => `${m.role === 'user' ? 'Learner' : 'Mellow'}: ${m.content}`).join('\n');
    const out = await structured(CLARIFY_SYSTEM, `Conversation so far:\n${transcript}`, ClarifyOutput);
    return out.kind === 'question'
      ? { kind: 'question', question: out.question }
      : { kind: 'summary', summary: out.summary, message: out.message || "Here's what I heard:" };
  }
  if (action === 'generateGraph') {
    const { summary } = z.object({ summary: GoalSummary }).parse(payload);
    return structured(GRAPH_SYSTEM, `Goal: ${JSON.stringify(summary)}`, GraphOutput);
  }
  throw new Error('unknown action');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { action, payload } = await req.json();
    const data = await handle(action, payload);
    return Response.json(data, { headers: CORS });
  } catch (error) {
    console.error('ai function error', error);
    const status = error instanceof z.ZodError ? 400 : 502;
    return Response.json({ error: 'ai_failed' }, { status, headers: CORS });
  }
});
