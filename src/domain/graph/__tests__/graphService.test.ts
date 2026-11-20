import { GraphGenerationError, generateValidGraph, repairGraph } from '../graphService';
import type { ConceptGraph } from '../types';
import { c, robotGraph } from './fixtures';
import type { AIProvider, GoalSummary } from '@/ai/types';

const summary: GoalSummary = { title: 'Robot', endGoal: 'Build a robot', domain: 'Robotics', constraints: [] };
const cyclic: ConceptGraph = { goal: 'x', concepts: [c('a', ['b']), c('b', ['a'])] };

function aiReturning(...graphs: ConceptGraph[]) {
  let i = 0;
  const generateGraph = vi.fn(async () => graphs[Math.min(i++, graphs.length - 1)]);
  return { ai: { generateGraph } as unknown as AIProvider, generateGraph };
}

describe('repairGraph', () => {
  it('drops dangling prerequisites, duplicates and self loops', () => {
    const repaired = repairGraph({
      goal: 'x',
      concepts: [c('a', ['ghost', 'a']), c('a'), c('b', ['a'])],
    });
    expect(repaired.concepts.map((x) => x.id)).toEqual(['a', 'b']);
    expect(repaired.concepts[0].prerequisites).toEqual([]);
  });
});

describe('generateValidGraph', () => {
  it('returns a valid graph on the first try', async () => {
    const { ai, generateGraph } = aiReturning(robotGraph);
    expect(await generateValidGraph(ai, summary)).toEqual(robotGraph);
    expect(generateGraph).toHaveBeenCalledTimes(1);
  });

  it('repairs small mistakes without calling the model again', async () => {
    const sloppy: ConceptGraph = { ...robotGraph, concepts: [...robotGraph.concepts, c('extra', ['ghost'])] };
    const { ai, generateGraph } = aiReturning(sloppy);
    const graph = await generateValidGraph(ai, summary);
    expect(graph.concepts.find((x) => x.id === 'extra')?.prerequisites).toEqual([]);
    expect(generateGraph).toHaveBeenCalledTimes(1);
  });

  it('retries once when the graph cannot be repaired (cycle)', async () => {
    const { ai, generateGraph } = aiReturning(cyclic, robotGraph);
    expect(await generateValidGraph(ai, summary)).toEqual(robotGraph);
    expect(generateGraph).toHaveBeenCalledTimes(2);
  });

  it('fails with a friendly error after the retry', async () => {
    const { ai, generateGraph } = aiReturning(cyclic, cyclic);
    await expect(generateValidGraph(ai, summary)).rejects.toBeInstanceOf(GraphGenerationError);
    expect(generateGraph).toHaveBeenCalledTimes(2);
  });

  it('treats a provider failure like an invalid graph', async () => {
    let calls = 0;
    const ai = {
      generateGraph: async () => {
        calls++;
        if (calls === 1) throw new Error('timeout');
        return robotGraph;
      },
    } as unknown as AIProvider;
    expect(await generateValidGraph(ai, summary)).toEqual(robotGraph);
  });
});
