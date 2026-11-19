export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

export type AuthResult = { ok: true; user: AuthUser | null; needsVerification?: boolean } | { ok: false; error: string };

export type SignOutReason = 'manual' | 'expired';

export interface AuthService {
  current(): AuthUser | null;
  /** Why the user is signed out, so the login page can explain an expired session gently. */
  signOutReason(): SignOutReason | null;
  /** Subscribe to sign-in/sign-out. Returns an unsubscribe function. */
  onChange(listener: (user: AuthUser | null) => void): () => void;
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
}
