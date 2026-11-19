/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_AI_PROVIDER?: 'mock' | 'claude';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
