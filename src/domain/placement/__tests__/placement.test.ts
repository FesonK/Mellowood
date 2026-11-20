import { answer, createPlacement, isDone, nextQuestion, placementResult, KNOWN_MASTERY } from '../placement';
import { topoSort } from '@/domain/graph';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';

/** Simulate a learner who knows exactly the first `boundary` concepts in topological order. */
function run(boundary: number) {
  const order = topoSort(robotGraph);
  let state = createPlacement(robotGraph);
  let questions = 0;
  for (let q = nextQuestion(state); q; q = nextQuestion(state)) {
    questions++;
    state = answer(state, order.indexOf(q) < boundary);
  }
  return { state, questions, order };
}

describe('placement engine', () => {
  const n = robotGraph.concepts.length;

  it('starts with a question from the middle of the graph', () => {
    const order = topoSort(robotGraph);
    expect(nextQuestion(createPlacement(robotGraph))).toBe(order[Math.floor(n / 2)]);
  });

  it.each(Array.from({ length: n + 1 }, (_, b) => b))('finds the true boundary %i', (boundary) => {
    const { state, questions, order } = run(boundary);
    expect(isDone(state)).toBe(true);
    expect(questions).toBeLessThanOrEqual(Math.ceil(Math.log2(n)) + 1);
    const mastery = placementResult(state);
    order.forEach((id, i) => expect(mastery[id] ?? 0).toBe(i < boundary ? KNOWN_MASTERY : 0));
  });

  it('marks the prerequisites of a known concept as known', () => {
    let state = createPlacement(robotGraph);
    // say "I know it" once, then "Not yet" to everything else
    state = answer(state, true);
    while (nextQuestion(state)) state = answer(state, false);
    const mastery = placementResult(state);
    const order = topoSort(robotGraph);
    const firstAsked = order[Math.floor(n / 2)];
    const known = Object.keys(mastery).filter((k) => mastery[k] === KNOWN_MASTERY);
    expect(known).toContain(firstAsked);
    expect(known).toContain('basics/variables');
  });

  it('is immutable', () => {
    const state = createPlacement(robotGraph);
    answer(state, true);
    expect(nextQuestion(state)).toBe(nextQuestion(createPlacement(robotGraph)));
  });
});
