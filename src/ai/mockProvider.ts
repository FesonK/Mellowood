import { MAX_FOLLOW_UPS, type AIProvider, type ChatMessage, type ClarifyResult, type GoalSummary } from './types';

const OUTCOME =
  /\b(build|make|create|design|write|ship|launch|pass|become|automate|train|sort|deploy|cook|bake|play|speak|draw|paint|compose|program|code|fix|run|teach)\b/i;
const CONSTRAINT =
  /(\d+\s*(h|hrs?|hours?)\b|\bhours?\b|\bweek(ly|end|s)?\b|\bmonths?\b|\bbudget\b|\$\s?\d+|\bfree\b|\blaptop\b|\bcomputer\b|\braspberry pi\b|\barduino\b|\bbeginner\b|\bno experience\b|\bdeadline\b)/i;
const OUTCOME_QUESTION_MARK = 'build or do';
const CONSTRAINT_QUESTION_MARK = 'hours';

const DOMAINS: [RegExp, string][] = [
  [/\b(robot\w*|arduino|servo|drone|raspberry pi)\b/i, 'Robotics'],
  [/\b(ai|machine learning|ml|neural|chatbots?|llms?|deep learning)\b/i, 'Machine Learning'],
  [/\b(web|website|react|javascript|frontend|backend|app)\b/i, 'Software Development'],
  [/\b(guitar|piano|music|songs?|sing|drums?)\b/i, 'Music'],
  [/\b(games?|unity|godot)\b/i, 'Game Development'],
  [/\b(data|statistics|excel|sql|analytics)\b/i, 'Data Science'],
  [/\b(draw|drawing|paint|painting|art|illustrat\w*)\b/i, 'Art'],
  [/\b(cook|cooking|bake|baking|bread)\b/i, 'Cooking'],
  [/\b(spanish|french|japanese|german|language)\b/i, 'Languages'],
];

const sleep = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

export class MockAIProvider implements AIProvider {
  private readonly delayMs: number;

  constructor({ delayMs = 700 }: { delayMs?: number } = {}) {
    this.delayMs = delayMs;
  }

  async clarifyGoal(messages: ChatMessage[]): Promise<ClarifyResult> {
    await sleep(this.delayMs);
    const askedOutcome = messages.findIndex((m) => m.role === 'assistant' && m.content.includes(OUTCOME_QUESTION_MARK));
    const askedConstraints = messages.some((m) => m.role === 'assistant' && m.content.includes(CONSTRAINT_QUESTION_MARK));
    const followUps = messages.filter((m) => m.role === 'assistant').length;
    const userTexts = messages.filter((m) => m.role === 'user').map((m) => m.content);
    const answeredOutcome = askedOutcome >= 0 && messages.slice(askedOutcome + 1).some((m) => m.role === 'user');

    const hasOutcome = userTexts.some((t) => OUTCOME.test(t)) || answeredOutcome;
    const hasConstraints = userTexts.some((t) => CONSTRAINT.test(t)) || askedConstraints;

    if (followUps < MAX_FOLLOW_UPS) {
      if (!hasOutcome) {
        return {
          kind: 'question',
          question:
            "Ooh, I love that! Let's make it concrete: when you're done, what do you want to be able to build or do? A tiny project you'd be proud of is perfect.",
        };
      }
      if (!hasConstraints) {
        return {
          kind: 'question',
          question:
            'Sounds amazing! How many hours a week can you spend, and what tools or budget do you already have? (Totally fine to say "no idea yet".)',
        };
      }
    }

    const summary = summarize(messages, askedOutcome);
    return { kind: 'summary', summary, message: "Yay, I think I've got it! Here's what I heard:" };
  }
}

function summarize(messages: ChatMessage[], askedOutcomeIndex: number): GoalSummary {
  const userTexts = messages.filter((m) => m.role === 'user').map((m) => m.content.trim());
  const outcomeAnswer =
    askedOutcomeIndex >= 0 ? messages.slice(askedOutcomeIndex + 1).find((m) => m.role === 'user')?.content : undefined;
  const raw = userTexts.find((t) => OUTCOME.test(t)) ?? outcomeAnswer ?? userTexts[0] ?? 'Learn something new';
  const endGoal = tidy(raw.split(/[,;]|\bmaybe\b/i)[0]);
  const all = userTexts.join(' ');
  const domain = DOMAINS.find(([re]) => re.test(all))?.[1] ?? 'General';
  const constraints = userTexts
    .flatMap((t) => t.split(/[,;.]/))
    .map((s) => tidy(s))
    .filter((s) => s && CONSTRAINT.test(s));
  return { title: truncate(endGoal, 60), endGoal, domain, constraints: [...new Set(constraints)] };
}

function tidy(text: string) {
  const t = text.trim().replace(/^(i want to|i'd like to|i would like to|i wanna|i want)\s+/i, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 20 ? cut.lastIndexOf(' ') : cut.length)}…`;
}
