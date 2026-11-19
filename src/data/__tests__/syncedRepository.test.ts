import { MemoryRepository } from '../memoryRepository';
import { SyncedRepository } from '../syncedRepository';
import type { Repository } from '../types';

class FlakyRemote extends MemoryRepository {
  online = true;
  calls: string[] = [];
  private guard(op: string) {
    this.calls.push(op);
    if (!this.online) throw new Error('network down');
  }
  async put<T extends { id: string }>(u: string, c: string, d: T) {
    this.guard(`put:${c}:${d.id}`);
    return super.put(u, c, d);
  }
  async remove(u: string, c: string, id: string) {
    this.guard(`remove:${c}:${id}`);
    return super.remove(u, c, id);
  }
  async list<T>(u: string, c: string) {
    this.guard(`list:${c}`);
    return super.list<T>(u, c);
  }
}

describe('SyncedRepository offline behaviour', () => {
  let local: Repository;
  let remote: FlakyRemote;
  let repo: SyncedRepository;

  beforeEach(() => {
    local = new MemoryRepository();
    remote = new FlakyRemote();
    repo = new SyncedRepository(local, remote, { storage: localStorage, isOnline: () => remote.online });
  });

  it('writes through to the remote when online', async () => {
    await repo.put('u1', 'goals', { id: 'g1' });
    expect(await remote.get('u1', 'goals', 'g1')).toEqual({ id: 'g1' });
    expect(repo.pendingCount()).toBe(0);
  });

  it('keeps working offline and queues the writes', async () => {
    remote.online = false;
    await repo.put('u1', 'goals', { id: 'g1' });
    await repo.put('u1', 'goals', { id: 'g2' });
    await repo.remove('u1', 'goals', 'g1');
    expect(await repo.list('u1', 'goals')).toEqual([{ id: 'g2' }]);
    expect(repo.pendingCount()).toBe(3);
  });

  it('flushes queued writes in order once back online', async () => {
    remote.online = false;
    await repo.put('u1', 'goals', { id: 'g1' });
    await repo.remove('u1', 'goals', 'g1');
    await repo.put('u1', 'goals', { id: 'g2' });
    remote.online = true;
    remote.calls = [];
    await repo.flush();
    expect(remote.calls).toEqual(['put:goals:g1', 'remove:goals:g1', 'put:goals:g2']);
    expect(await remote.list('u1', 'goals')).toEqual([{ id: 'g2' }]);
    expect(repo.pendingCount()).toBe(0);
  });

  it('persists the queue so writes survive a reload', async () => {
    remote.online = false;
    await repo.put('u1', 'goals', { id: 'g1' });
    const reloaded = new SyncedRepository(local, remote, { storage: localStorage, isOnline: () => remote.online });
    expect(reloaded.pendingCount()).toBe(1);
    remote.online = true;
    await reloaded.flush();
    expect(await remote.get('u1', 'goals', 'g1')).toEqual({ id: 'g1' });
  });

  it('pulls remote documents into the local cache (other device)', async () => {
    await remote.put('u1', 'sessions', { id: 's1', state: 'paused' });
    await repo.pull('u1', ['sessions']);
    expect(await local.get('u1', 'sessions', 's1')).toEqual({ id: 's1', state: 'paused' });
  });

  it('does not overwrite queued local writes when pulling', async () => {
    await remote.put('u1', 'goals', { id: 'g1', v: 'remote' });
    remote.online = false;
    await repo.put('u1', 'goals', { id: 'g1', v: 'local' });
    remote.online = true;
    await repo.pull('u1', ['goals']);
    expect(await repo.get('u1', 'goals', 'g1')).toEqual({ id: 'g1', v: 'local' });
  });
});
