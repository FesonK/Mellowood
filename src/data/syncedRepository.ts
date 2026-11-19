import type { Collection, Doc, Repository } from './types';

type PendingOp =
  | { op: 'put'; userId: string; collection: Collection; doc: Doc }
  | { op: 'remove'; userId: string; collection: Collection; id: string }
  | { op: 'wipe'; userId: string };

export interface SyncOptions {
  storage: Storage;
  isOnline?: () => boolean;
  queueKey?: string;
}

/**
 * Local-first repository: every read and write hits the local cache immediately, and writes are
 * queued for the remote. The queue is persisted, so nothing is lost if the app closes offline,
 * and it is replayed in order whenever we are online again.
 */
export class SyncedRepository implements Repository {
  private queue: PendingOp[];
  private flushing: Promise<void> | null = null;
  private readonly storage: Storage;
  private readonly isOnline: () => boolean;
  private readonly queueKey: string;

  constructor(
    private readonly local: Repository,
    private readonly remote: Repository,
    { storage, isOnline = () => navigator.onLine, queueKey = 'mellowood:sync-queue' }: SyncOptions,
  ) {
    this.storage = storage;
    this.isOnline = isOnline;
    this.queueKey = queueKey;
    this.queue = this.loadQueue();
  }

  private loadQueue(): PendingOp[] {
    try {
      const parsed = JSON.parse(this.storage.getItem(this.queueKey) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveQueue() {
    this.storage.setItem(this.queueKey, JSON.stringify(this.queue));
  }

  private async enqueue(op: PendingOp) {
    this.queue.push(op);
    this.saveQueue();
    await this.flush();
  }

  pendingCount() {
    return this.queue.length;
  }

  /** Replays queued writes in order; stops at the first failure and keeps the rest for later. */
  flush(): Promise<void> {
    if (this.flushing) return this.flushing;
    const run = this.drain().finally(() => {
      if (this.flushing === run) this.flushing = null;
    });
    this.flushing = run;
    return run;
  }

  private async drain(): Promise<void> {
    while (this.queue.length && this.isOnline()) {
      const op = this.queue[0];
      try {
        if (op.op === 'put') await this.remote.put(op.userId, op.collection, op.doc);
        else if (op.op === 'remove') await this.remote.remove(op.userId, op.collection, op.id);
        else await this.remote.wipeUser(op.userId);
      } catch {
        return;
      }
      this.queue.shift();
      this.saveQueue();
    }
  }

  /** Brings documents written on other devices into the local cache, keeping unsynced local edits. */
  async pull(userId: string, collections: Collection[]): Promise<void> {
    if (!this.isOnline()) return;
    for (const collection of collections) {
      let docs: Doc[];
      try {
        docs = await this.remote.list<Doc>(userId, collection);
      } catch {
        continue;
      }
      const dirty = new Set(
        this.queue
          .filter((op) => op.op !== 'wipe' && op.userId === userId && op.collection === collection)
          .map((op) => (op.op === 'put' ? op.doc.id : op.op === 'remove' ? op.id : '')),
      );
      for (const doc of docs) if (!dirty.has(doc.id)) await this.local.put(userId, collection, doc);
    }
  }

  /** Flush automatically whenever the browser comes back online. Returns an unsubscribe function. */
  autoFlush(target: Pick<Window, 'addEventListener' | 'removeEventListener'> = window) {
    const handler = () => void this.flush();
    target.addEventListener('online', handler);
    return () => target.removeEventListener('online', handler);
  }

  get<T>(userId: string, collection: Collection, id: string) {
    return this.local.get<T>(userId, collection, id);
  }

  list<T>(userId: string, collection: Collection) {
    return this.local.list<T>(userId, collection);
  }

  async put<T extends Doc>(userId: string, collection: Collection, doc: T) {
    await this.local.put(userId, collection, doc);
    await this.enqueue({ op: 'put', userId, collection, doc: structuredClone(doc) });
  }

  async remove(userId: string, collection: Collection, id: string) {
    await this.local.remove(userId, collection, id);
    await this.enqueue({ op: 'remove', userId, collection, id });
  }

  async wipeUser(userId: string) {
    await this.local.wipeUser(userId);
    this.queue = this.queue.filter((op) => op.userId !== userId);
    await this.enqueue({ op: 'wipe', userId });
  }
}
