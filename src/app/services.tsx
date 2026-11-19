import { createContext, useContext, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
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
}

/** Wire real services from env: Supabase when configured, otherwise fully local. */
export function createServices(env: AppEnv = readEnv()): AppServices {
  const local = new LocalStorageRepository(localStorage);
  if (!hasSupabase(env)) {
    return { auth: new MockAuthService(localStorage), repo: local };
  }
  const client = createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  const repo = new SyncedRepository(local, new SupabaseRepository(client), { storage: localStorage });
  repo.autoFlush();
  return { auth: new SupabaseAuthService(client), repo };
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
