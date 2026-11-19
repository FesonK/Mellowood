import { hasSupabase, readEnv } from '../env';

describe('readEnv', () => {
  it('defaults to fully local mode', () => {
    const env = readEnv({});
    expect(env).toEqual({ supabaseUrl: undefined, supabaseAnonKey: undefined, aiProvider: 'mock' });
    expect(hasSupabase(env)).toBe(false);
  });

  it('enables Supabase and Claude when configured', () => {
    const env = readEnv({
      VITE_SUPABASE_URL: 'https://x.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon',
      VITE_AI_PROVIDER: 'claude',
    });
    expect(hasSupabase(env)).toBe(true);
    expect(env.aiProvider).toBe('claude');
  });

  it('falls back to the mock AI when Supabase is missing', () => {
    expect(readEnv({ VITE_AI_PROVIDER: 'claude' }).aiProvider).toBe('mock');
  });
});
