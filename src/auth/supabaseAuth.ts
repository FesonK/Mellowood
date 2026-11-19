import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AuthResult, AuthService, AuthUser, SignOutReason } from './types';
import { INVALID_CREDENTIALS } from './mockAuth';
import { normalizeEmail, validateEmail, validatePassword } from './validation';

const toUser = (u: User | null | undefined): AuthUser | null =>
  u ? { id: u.id, email: u.email ?? '', displayName: (u.user_metadata?.display_name as string) || undefined } : null;

export class SupabaseAuthService implements AuthService {
  private user: AuthUser | null = null;
  private reason: SignOutReason | null = null;
  private manualSignOut = false;
  private listeners = new Set<(user: AuthUser | null) => void>();

  constructor(protected readonly client: SupabaseClient) {
    // Supabase persists the session in localStorage and refreshes tokens; this keeps us in sync.
    client.auth.onAuthStateChange((event, session) => {
      const hadUser = Boolean(this.user);
      this.user = toUser(session?.user);
      if (event === 'SIGNED_OUT') {
        this.reason = this.manualSignOut || !hadUser ? 'manual' : 'expired';
        this.manualSignOut = false;
      } else if (this.user) {
        this.reason = null;
      }
      this.listeners.forEach((l) => l(this.user));
    });
  }

  current() {
    return this.user;
  }

  signOutReason() {
    return this.user ? null : this.reason;
  }

  onChange(listener: (user: AuthUser | null) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const invalid = validateEmail(email) ?? validatePassword(password);
    if (invalid) return { ok: false, error: invalid };
    const { data, error } = await this.client.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, user: toUser(data.user), needsVerification: !data.session };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.client.auth.signInWithPassword({ email: normalizeEmail(email), password });
    if (error) return { ok: false, error: INVALID_CREDENTIALS };
    return { ok: true, user: toUser(data.user) };
  }

  async signOut() {
    this.manualSignOut = true;
    await this.client.auth.signOut();
  }
}
