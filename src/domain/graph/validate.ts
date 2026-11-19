import { topoSort } from './algorithms';
import type { ConceptGraph } from './types';

export type GraphErrorCode =
  | 'empty'
  | 'duplicate-id'
  | 'invalid-id'
  | 'invalid-hours'
  | 'dangling-prerequisite'
  | 'cycle';

export interface GraphError {
  code: GraphErrorCode;
  message: string;
  conceptId?: string;
}

export type GraphValidation = { ok: true } | { ok: false; errors: GraphError[] };

const SEGMENT = '[a-z0-9]+(?:-[a-z0-9]+)*';
const SLUG = new RegExp(`^${SEGMENT}(?:/${SEGMENT})*$`);

export const isValidConceptId = (id: string) => SLUG.test(id);

export function validateGraph(graph: ConceptGraph): GraphValidation {
  const errors: GraphError[] = [];
  if (!graph.concepts?.length) {
    return { ok: false, errors: [{ code: 'empty', message: 'The graph has no concepts.' }] };
  }

  const ids = new Set<string>();
  for (const concept of graph.concepts) {
    if (ids.has(concept.id)) {
      errors.push({ code: 'duplicate-id', conceptId: concept.id, message: `Duplicate concept id "${concept.id}".` });
    }
    ids.add(concept.id);
    if (!isValidConceptId(concept.id)) {
      errors.push({ code: 'invalid-id', conceptId: concept.id, message: `"${concept.id}" is not a valid slug.` });
    }
    if (!(Number.isFinite(concept.hours) && concept.hours > 0)) {
      errors.push({ code: 'invalid-hours', conceptId: concept.id, message: `"${concept.id}" needs positive hours.` });
    }
  }

  for (const concept of graph.concepts) {
    for (const p of concept.prerequisites) {
      if (!ids.has(p)) {
        errors.push({
          code: 'dangling-prerequisite',
          conceptId: concept.id,
          message: `"${concept.id}" requires unknown concept "${p}".`,
        });
      }
    }
  }

  if (topoSort(graph).length < ids.size) {
    errors.push({ code: 'cycle', message: 'The prerequisites form a cycle.' });
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
