import type { Collection, Doc, Repository } from './types';

type Bucket = Record<string, unknown>;

/** Persists each (user, collection) pair as one JSON object in Web Storage. */
export class LocalStorageRepository implements Repository {
  constructor(
    private readonly storage: Storage,
    private readonly prefix = 'mellowood',
  ) {}

  private key(userId: string, collection: Collection) {
    return `${this.prefix}:${userId}:${collection}`;
  }

  private read(userId: string, collection: Collection): Bucket {
    try {
      const parsed = JSON.parse(this.storage.getItem(this.key(userId, collection)) ?? '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Bucket) : {};
    } catch {
      return {};
    }
  }

  private write(userId: string, collection: Collection, bucket: Bucket) {
    this.storage.setItem(this.key(userId, collection), JSON.stringify(bucket));
  }

  async get<T>(userId: string, collection: Collection, id: string): Promise<T | null> {
    const doc = this.read(userId, collection)[id];
    return doc === undefined ? null : (structuredClone(doc) as T);
  }

  async put<T extends Doc>(userId: string, collection: Collection, doc: T): Promise<void> {
    const bucket = this.read(userId, collection);
    bucket[doc.id] = doc;
    this.write(userId, collection, bucket);
  }

  async list<T>(userId: string, collection: Collection): Promise<T[]> {
    return Object.values(this.read(userId, collection)) as T[];
  }

  async remove(userId: string, collection: Collection, id: string): Promise<void> {
    const bucket = this.read(userId, collection);
    delete bucket[id];
    this.write(userId, collection, bucket);
  }

  async wipeUser(userId: string): Promise<void> {
    const prefix = `${this.prefix}:${userId}:`;
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const k = this.storage.key(i);
      if (k?.startsWith(prefix)) keys.push(k);
    }
    keys.forEach((k) => this.storage.removeItem(k));
  }
}
