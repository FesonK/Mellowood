import { createContext, useContext, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { AIProvider } from '@/ai/types';
import { MockAIProvider } from '@/ai/mockProvider';
import { ClaudeProvider, supabaseInvoker } from '@/ai/claudeProvider';
import type { AuthService } from '@/auth/types';
import { MockAuthService } from '@/auth/mockAuth';
import { SupabaseAuthService } from '@/auth/supabaseAuth';
import type { Repository } from '@/data/types';
import { LocalStorageRepository } from '@/data/localStorageRepository';
import { SupabaseRepository } from '@/data/supabaseRepository';
import { SyncedRepository } from '@/data/syncedRepository';
import { hasSupabase, readEnv, type AppEnv } from '@/lib/env';

export interface AppServices {
  auth: AuthService;
  repo: Repository;
  ai: AIProvider;
}

/** Wire real services from env: Supabase when configured, otherwise fully local. */
export function createServices(env: AppEnv = readEnv()): AppServices {
  const local = new LocalStorageRepository(localStorage);
  const ai: AIProvider = new MockAIProvider();
  if (!hasSupabase(env)) {
    return { auth: new MockAuthService(localStorage), repo: local, ai };
  }
  const client = createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  const repo = new SyncedRepository(local, new SupabaseRepository(client), { storage: localStorage });
  repo.autoFlush();
  const remoteAI = env.aiProvider === 'claude' ? new ClaudeProvider(supabaseInvoker(client)) : ai;
  return { auth: new SupabaseAuthService(client), repo, ai: remoteAI };
}

const ServicesContext = createContext<AppServices | null>(null);

export function ServicesProvider({ services, children }: { services: AppServices; children: ReactNode }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>');
  return services;
}
