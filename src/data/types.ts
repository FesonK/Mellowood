export type Collection =
  | 'profile'
  | 'goals'
  | 'drafts'
  | 'tracks'
  | 'mastery'
  | 'sessions'
  | 'submissions'
  | 'strategy'
  | (string & {});

export interface Doc {
  id: string;
}

/**
 * A per-user document store. Every feature persists through this interface so the backend
 * (memory, localStorage, Supabase) can be swapped without touching feature code.
 */
export interface Repository {
  get<T>(userId: string, collection: Collection, id: string): Promise<T | null>;
  put<T extends Doc>(userId: string, collection: Collection, doc: T): Promise<void>;
  list<T>(userId: string, collection: Collection): Promise<T[]>;
  remove(userId: string, collection: Collection, id: string): Promise<void>;
  wipeUser(userId: string): Promise<void>;
}
