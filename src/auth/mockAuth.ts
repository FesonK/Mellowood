import type { AuthResult, AuthService, AuthUser, SignOutReason } from './types';
import { normalizeEmail, validateEmail, validatePassword } from './validation';

export const INVALID_CREDENTIALS = "That email and password don't match. Mind trying again?";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredSession {
  user: AuthUser;
  expiresAt: number;
}

interface StoredUser extends AuthUser {
  salt: string;
  hash: string;
}

/**
 * Local, offline auth used when Supabase isn't configured and in tests. It only protects data on
 * this device; it is not a security boundary. Passwords are salted and hashed (never stored raw).
 */
export class MockAuthService implements AuthService {
  private user: AuthUser | null = null;
  private reason: SignOutReason | null = null;
  private listeners = new Set<(user: AuthUser | null) => void>();

  constructor(
    protected readonly storage: Storage,
    protected readonly prefix = 'mellowood:auth',
    protected readonly now: () => number = Date.now,
  ) {
    this.restoreSession();
  }

  private get sessionKey() {
    return `${this.prefix}:session`;
  }

  private restoreSession() {
    try {
      const session = JSON.parse(this.storage.getItem(this.sessionKey) ?? 'null') as StoredSession | null;
      if (!session) return;
      if (session.expiresAt <= this.now()) {
        this.storage.removeItem(this.sessionKey);
        this.reason = 'expired';
        return;
      }
      this.user = session.user;
    } catch {
      this.storage.removeItem(this.sessionKey);
    }
  }

  signOutReason() {
    return this.user ? null : this.reason;
  }

  protected readUsers(): Record<string, StoredUser> {
    try {
      return JSON.parse(this.storage.getItem(`${this.prefix}:users`) ?? '{}');
    } catch {
      return {};
    }
  }

  protected writeUsers(users: Record<string, StoredUser>) {
    this.storage.setItem(`${this.prefix}:users`, JSON.stringify(users));
  }

  protected setUser(user: AuthUser | null) {
    this.user = user;
    if (user) {
      const session: StoredSession = { user, expiresAt: this.now() + SESSION_TTL_MS };
      this.storage.setItem(this.sessionKey, JSON.stringify(session));
      this.reason = null;
    } else {
      this.storage.removeItem(this.sessionKey);
      this.reason = 'manual';
    }
    this.listeners.forEach((l) => l(user));
  }

  current() {
    return this.user;
  }

  onChange(listener: (user: AuthUser | null) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async signUp(rawEmail: string, password: string): Promise<AuthResult> {
    const error = validateEmail(rawEmail) ?? validatePassword(password);
    if (error) return { ok: false, error };
    const email = normalizeEmail(rawEmail);
    const users = this.readUsers();
    if (users[email]) return { ok: false, error: 'An account with that email already exists. Try logging in!' };
    const salt = randomId();
    const user: StoredUser = { id: randomId(), email, salt, hash: hashPassword(password, salt) };
    users[email] = user;
    this.writeUsers(users);
    const publicUser = toPublic(user);
    this.setUser(publicUser);
    return { ok: true, user: publicUser };
  }

  async signIn(rawEmail: string, password: string): Promise<AuthResult> {
    const stored = this.readUsers()[normalizeEmail(rawEmail)];
    if (!stored || stored.hash !== hashPassword(password, stored.salt)) return { ok: false, error: INVALID_CREDENTIALS };
    const user = toPublic(stored);
    this.setUser(user);
    return { ok: true, user };
  }

  async signOut() {
    this.setUser(null);
  }
}

const toPublic = ({ id, email, displayName }: StoredUser): AuthUser => ({ id, email, displayName });

export function randomId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** cyrb53-style string hash, iterated. Fine for a device-local mock; real auth uses Supabase. */
function hashPassword(password: string, salt: string) {
  let input = `${salt}:${password}`;
  for (let round = 0; round < 64; round++) {
    let h1 = 0xdeadbeef ^ round;
    let h2 = 0x41c6ce57 ^ round;
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    input = `${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}${salt}`;
  }
  return input;
}
