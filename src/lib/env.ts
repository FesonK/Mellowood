export interface AppEnv {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  aiProvider: 'mock' | 'claude';
}

export function readEnv(source: Record<string, string | undefined> = import.meta.env): AppEnv {
  const supabaseUrl = source.VITE_SUPABASE_URL?.trim() || undefined;
  const supabaseAnonKey = source.VITE_SUPABASE_ANON_KEY?.trim() || undefined;
  const aiProvider = source.VITE_AI_PROVIDER === 'claude' && supabaseUrl ? 'claude' : 'mock';
  return { supabaseUrl, supabaseAnonKey, aiProvider };
}

export const hasSupabase = (env: AppEnv) => Boolean(env.supabaseUrl && env.supabaseAnonKey);
