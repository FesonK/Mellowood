/** A unit of knowledge. `id` is a canonical slug shared across all tracks so mastery carries over. */
export interface Concept {
  id: string;
  name: string;
  summary: string;
  /** Estimated focused hours to go from zero to mastery. */
  hours: number;
  prerequisites: string[];
}

export interface ConceptGraph {
  goal: string;
  concepts: Concept[];
}

/** Mastery per concept id, 0..1. Missing ids mean 0. */
export type MasteryMap = Record<string, number>;
