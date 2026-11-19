import type { Collection, Doc, Repository } from './types';

/** In-memory store. Documents are stored serialized so callers never share references. */
export class MemoryRepository implements Repository {
  private store = new Map<string, Map<string, string>>();

  private bucket(userId: string, collection: Collection, create = false) {
    const key = `${userId}\u0000${collection}`;
    let bucket = this.store.get(key);
    if (!bucket && create) {
      bucket = new Map();
      this.store.set(key, bucket);
    }
    return bucket;
  }

  async get<T>(userId: string, collection: Collection, id: string): Promise<T | null> {
    const raw = this.bucket(userId, collection)?.get(id);
    return raw === undefined ? null : (JSON.parse(raw) as T);
  }

  async put<T extends Doc>(userId: string, collection: Collection, doc: T): Promise<void> {
    this.bucket(userId, collection, true)!.set(doc.id, JSON.stringify(doc));
  }

  async list<T>(userId: string, collection: Collection): Promise<T[]> {
    return [...(this.bucket(userId, collection)?.values() ?? [])].map((raw) => JSON.parse(raw) as T);
  }

  async remove(userId: string, collection: Collection, id: string): Promise<void> {
    this.bucket(userId, collection)?.delete(id);
  }

  async wipeUser(userId: string): Promise<void> {
    for (const key of [...this.store.keys()]) if (key.startsWith(`${userId}\u0000`)) this.store.delete(key);
  }
}
