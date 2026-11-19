import type { SupabaseClient } from '@supabase/supabase-js';
import type { Collection, Doc, Repository } from './types';

/**
 * Remote store backed by the `documents` table (see supabase/migrations). Row-level security
 * guarantees a user can only touch rows where user_id = auth.uid(); the userId argument must
 * match the signed-in user.
 */
export class SupabaseRepository implements Repository {
  constructor(private readonly client: SupabaseClient) {}

  private table() {
    return this.client.from('documents');
  }

  async get<T>(userId: string, collection: Collection, id: string): Promise<T | null> {
    const { data, error } = await this.table()
      .select('data')
      .eq('user_id', userId)
      .eq('collection', collection)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data?.data as T) ?? null;
  }

  async put<T extends Doc>(userId: string, collection: Collection, doc: T): Promise<void> {
    const { error } = await this.table().upsert({
      user_id: userId,
      collection,
      id: doc.id,
      data: doc,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  async list<T>(userId: string, collection: Collection): Promise<T[]> {
    const { data, error } = await this.table().select('data').eq('user_id', userId).eq('collection', collection);
    if (error) throw error;
    return (data ?? []).map((row) => row.data as T);
  }

  async remove(userId: string, collection: Collection, id: string): Promise<void> {
    const { error } = await this.table().delete().eq('user_id', userId).eq('collection', collection).eq('id', id);
    if (error) throw error;
  }

  async wipeUser(userId: string): Promise<void> {
    const { error } = await this.table().delete().eq('user_id', userId);
    if (error) throw error;
  }
}
