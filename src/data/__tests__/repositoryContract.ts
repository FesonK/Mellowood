import type { Repository } from '../types';

interface Note {
  id: string;
  text: string;
}

/** Shared behaviour every Repository implementation must satisfy. */
export function describeRepositoryContract(name: string, make: () => Repository) {
  describe(`${name} (repository contract)`, () => {
    let repo: Repository;
    beforeEach(() => {
      repo = make();
    });

    it('returns null for a missing document', async () => {
      expect(await repo.get('u1', 'goals', 'nope')).toBeNull();
    });

    it('puts and gets a document', async () => {
      await repo.put<Note>('u1', 'goals', { id: 'g1', text: 'robot arm' });
      expect(await repo.get<Note>('u1', 'goals', 'g1')).toEqual({ id: 'g1', text: 'robot arm' });
    });

    it('overwrites on put with the same id', async () => {
      await repo.put<Note>('u1', 'goals', { id: 'g1', text: 'a' });
      await repo.put<Note>('u1', 'goals', { id: 'g1', text: 'b' });
      expect(await repo.list<Note>('u1', 'goals')).toEqual([{ id: 'g1', text: 'b' }]);
    });

    it('lists documents in a collection only', async () => {
      await repo.put<Note>('u1', 'goals', { id: 'g1', text: 'a' });
      await repo.put<Note>('u1', 'goals', { id: 'g2', text: 'b' });
      await repo.put<Note>('u1', 'tracks', { id: 't1', text: 'c' });
      const goals = await repo.list<Note>('u1', 'goals');
      expect(goals.map((g) => g.id).sort()).toEqual(['g1', 'g2']);
    });

    it('isolates users from each other', async () => {
      await repo.put<Note>('u1', 'goals', { id: 'g1', text: 'mine' });
      expect(await repo.get('u2', 'goals', 'g1')).toBeNull();
      expect(await repo.list('u2', 'goals')).toEqual([]);
    });

    it('removes a document', async () => {
      await repo.put<Note>('u1', 'goals', { id: 'g1', text: 'a' });
      await repo.remove('u1', 'goals', 'g1');
      expect(await repo.get('u1', 'goals', 'g1')).toBeNull();
    });

    it('wipes every collection for one user only', async () => {
      await repo.put<Note>('u1', 'goals', { id: 'g1', text: 'a' });
      await repo.put<Note>('u1', 'tracks', { id: 't1', text: 'b' });
      await repo.put<Note>('u2', 'goals', { id: 'g9', text: 'keep' });
      await repo.wipeUser('u1');
      expect(await repo.list('u1', 'goals')).toEqual([]);
      expect(await repo.list('u1', 'tracks')).toEqual([]);
      expect(await repo.list('u2', 'goals')).toHaveLength(1);
    });

    it('returns copies, not live references', async () => {
      const doc = { id: 'g1', text: 'a' };
      await repo.put<Note>('u1', 'goals', doc);
      doc.text = 'mutated';
      expect((await repo.get<Note>('u1', 'goals', 'g1'))?.text).toBe('a');
    });
  });
}
