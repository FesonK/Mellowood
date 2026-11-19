import { MemoryRepository } from '../memoryRepository';
import { LocalStorageRepository } from '../localStorageRepository';
import { SyncedRepository } from '../syncedRepository';
import { describeRepositoryContract } from './repositoryContract';

describeRepositoryContract('MemoryRepository', () => new MemoryRepository());
describeRepositoryContract('LocalStorageRepository', () => new LocalStorageRepository(localStorage, 'test'));
describeRepositoryContract(
  'SyncedRepository',
  () => new SyncedRepository(new MemoryRepository(), new MemoryRepository(), { storage: localStorage, isOnline: () => true }),
);

describe('LocalStorageRepository persistence', () => {
  it('survives a new instance over the same storage', async () => {
    await new LocalStorageRepository(localStorage, 'p').put('u1', 'goals', { id: 'g1' });
    expect(await new LocalStorageRepository(localStorage, 'p').get('u1', 'goals', 'g1')).toEqual({ id: 'g1' });
  });

  it('treats corrupted storage as empty instead of crashing', async () => {
    localStorage.setItem('c:u1:goals', '{not json');
    expect(await new LocalStorageRepository(localStorage, 'c').list('u1', 'goals')).toEqual([]);
  });
});
