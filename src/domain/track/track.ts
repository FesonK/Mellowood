import { isMastered, topoSort } from '@/domain/graph/algorithms';
import type { ConceptGraph, MasteryMap } from '@/domain/graph/types';

export type StepStatus = 'locked' | 'available' | 'done';

export interface TrackStep {
  conceptId: string;
  status: StepStatus;
}

export interface Track {
  id: string;
  goalId: string;
  kind: 'custom';
  steps: TrackStep[];
  createdAt: string;
}

function statusFor(graph: ConceptGraph, mastery: MasteryMap, id: string): StepStatus {
  if (isMastered(mastery, id)) return 'done';
  const concept = graph.concepts.find((c) => c.id === id);
  return concept?.prerequisites.every((p) => isMastered(mastery, p)) ? 'available' : 'locked';
}

/** A custom track: the goal's concepts in topological order, minus what the learner already knows. */
export function buildTrack(goalId: string, graph: ConceptGraph, mastery: MasteryMap): Track {
  const steps = topoSort(graph)
    .filter((id) => !isMastered(mastery, id))
    .map((conceptId) => ({ conceptId, status: statusFor(graph, mastery, conceptId) }));
  return { id: goalId, goalId, kind: 'custom', steps, createdAt: new Date().toISOString() };
}

/** Recompute statuses after mastery changes, keeping the track's steps stable. */
export function refreshTrack(track: Track, graph: ConceptGraph, mastery: MasteryMap): Track {
  return { ...track, steps: track.steps.map((s) => ({ ...s, status: statusFor(graph, mastery, s.conceptId) })) };
}

export function trackProgress(track: Track) {
  const done = track.steps.filter((s) => s.status === 'done').length;
  const total = track.steps.length;
  return { done, total, ratio: total ? done / total : 1 };
}
