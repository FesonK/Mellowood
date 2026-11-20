import { depthLayers } from '@/domain/graph/algorithms';
import type { ConceptGraph } from '@/domain/graph/types';

export interface LayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
  gapX: number;
  gapY: number;
  padding?: number;
}

export interface GraphLayout {
  width: number;
  height: number;
  nodes: Record<string, { x: number; y: number; layer: number }>;
  edges: { from: string; to: string; path: string }[];
}

/** Rows by prerequisite depth (foundations on top), each row centred, with curved edges between them. */
export function layoutGraph(graph: ConceptGraph, { nodeWidth, nodeHeight, gapX, gapY, padding = 24 }: LayoutOptions): GraphLayout {
  const layers = depthLayers(graph);
  const rowWidth = (n: number) => n * nodeWidth + Math.max(0, n - 1) * gapX;
  const width = Math.max(...layers.map((l) => rowWidth(l.length)), nodeWidth) + padding * 2;
  const height = layers.length * nodeHeight + Math.max(0, layers.length - 1) * gapY + padding * 2;

  const nodes: GraphLayout['nodes'] = {};
  layers.forEach((layer, li) => {
    const startX = (width - rowWidth(layer.length)) / 2;
    layer.forEach((id, i) => {
      nodes[id] = { x: startX + i * (nodeWidth + gapX), y: padding + li * (nodeHeight + gapY), layer: li };
    });
  });

  const edges: GraphLayout['edges'] = [];
  for (const concept of graph.concepts) {
    const to = nodes[concept.id];
    if (!to) continue;
    for (const p of concept.prerequisites) {
      const from = nodes[p];
      if (!from) continue;
      const x1 = from.x + nodeWidth / 2;
      const y1 = from.y + nodeHeight;
      const x2 = to.x + nodeWidth / 2;
      const y2 = to.y;
      const mid = (y1 + y2) / 2;
      edges.push({ from: p, to: concept.id, path: `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}` });
    }
  }

  return { width, height, nodes, edges };
}
