import { validateGraph, isValidConceptId } from '../validate';
import { c, robotGraph } from './fixtures';

const codes = (result: ReturnType<typeof validateGraph>) => (result.ok ? [] : result.errors.map((e) => e.code));

describe('isValidConceptId', () => {
  it.each(['algebra', 'linear-algebra/matrix-multiplication', 'a1/b2-c3'])('accepts %s', (id) => {
    expect(isValidConceptId(id)).toBe(true);
  });
  it.each(['', 'Upper/Case', 'has space', '/leading', 'trailing/', 'double--dash', 'a//b'])('rejects "%s"', (id) => {
    expect(isValidConceptId(id)).toBe(false);
  });
});

describe('validateGraph', () => {
  it('accepts a valid DAG', () => {
    expect(validateGraph(robotGraph)).toEqual({ ok: true });
  });

  it('rejects an empty graph', () => {
    expect(codes(validateGraph({ goal: 'x', concepts: [] }))).toContain('empty');
  });

  it('rejects duplicate ids', () => {
    expect(codes(validateGraph({ goal: 'x', concepts: [c('a'), c('a')] }))).toContain('duplicate-id');
  });

  it('rejects dangling prerequisites', () => {
    const result = validateGraph({ goal: 'x', concepts: [c('a', ['ghost'])] });
    expect(codes(result)).toContain('dangling-prerequisite');
    expect(result.ok ? null : result.errors[0].conceptId).toBe('a');
  });

  it('rejects self loops and longer cycles', () => {
    expect(codes(validateGraph({ goal: 'x', concepts: [c('a', ['a'])] }))).toContain('cycle');
    expect(codes(validateGraph({ goal: 'x', concepts: [c('a', ['c']), c('b', ['a']), c('c', ['b'])] }))).toContain(
      'cycle',
    );
  });

  it('rejects invalid slugs and non-positive hours', () => {
    const result = validateGraph({ goal: 'x', concepts: [{ ...c('Bad Id'), hours: 0 }] });
    expect(codes(result)).toEqual(expect.arrayContaining(['invalid-id', 'invalid-hours']));
  });
});
