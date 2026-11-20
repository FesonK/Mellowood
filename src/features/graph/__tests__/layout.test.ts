import { layoutGraph } from '../layout';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';

describe('layoutGraph', () => {
  const layout = layoutGraph(robotGraph, { nodeWidth: 100, nodeHeight: 40, gapX: 20, gapY: 60 });

  it('positions every concept', () => {
    expect(Object.keys(layout.nodes).sort()).toEqual(robotGraph.concepts.map((c) => c.id).sort());
  });

  it('places prerequisites above their dependents', () => {
    for (const concept of robotGraph.concepts) {
      for (const p of concept.prerequisites) {
        expect(layout.nodes[p].y).toBeLessThan(layout.nodes[concept.id].y);
      }
    }
  });

  it('never overlaps two nodes', () => {
    const boxes = Object.values(layout.nodes);
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlap = Math.abs(a.x - b.x) < 100 && Math.abs(a.y - b.y) < 40;
        expect(overlap).toBe(false);
      }
  });

  it('reports a canvas big enough for every node and one edge per prerequisite', () => {
    for (const n of Object.values(layout.nodes)) {
      expect(n.x + 100).toBeLessThanOrEqual(layout.width);
      expect(n.y + 40).toBeLessThanOrEqual(layout.height);
    }
    expect(layout.edges).toHaveLength(robotGraph.concepts.reduce((s, c) => s + c.prerequisites.length, 0));
  });
});
