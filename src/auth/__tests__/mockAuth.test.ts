import { MockAuthService, INVALID_CREDENTIALS } from '../mockAuth';

describe('MockAuthService', () => {
  let auth: MockAuthService;
  beforeEach(() => {
    auth = new MockAuthService(localStorage);
  });

  it('starts signed out', () => {
    expect(auth.current()).toBeNull();
  });

  it('signs up, signs in and notifies listeners', async () => {
    const seen: (string | null)[] = [];
    auth.onChange((u) => seen.push(u?.email ?? null));
    const up = await auth.signUp('mel@wood.app', 'password1');
    expect(up.ok).toBe(true);
    expect(auth.current()?.email).toBe('mel@wood.app');
    await auth.signOut();
    const inn = await auth.signIn('MEL@wood.app ', 'password1');
    expect(inn.ok).toBe(true);
    expect(seen).toEqual(['mel@wood.app', null, 'mel@wood.app']);
  });

  it('gives the same generic error for a wrong password and an unknown email', async () => {
    await auth.signUp('mel@wood.app', 'password1');
    await auth.signOut();
    expect(await auth.signIn('mel@wood.app', 'wrongpass')).toEqual({ ok: false, error: INVALID_CREDENTIALS });
    expect(await auth.signIn('ghost@wood.app', 'password1')).toEqual({ ok: false, error: INVALID_CREDENTIALS });
  });

  it('refuses duplicate sign ups', async () => {
    await auth.signUp('mel@wood.app', 'password1');
    const again = await auth.signUp('mel@wood.app', 'password2');
    expect(again.ok).toBe(false);
  });

  it('validates input on sign up', async () => {
    expect((await auth.signUp('bad', 'password1')).ok).toBe(false);
    expect((await auth.signUp('ok@wood.app', 'short')).ok).toBe(false);
  });

  it('never stores the raw password', async () => {
    await auth.signUp('mel@wood.app', 'supersecret');
    const everything = Object.keys(localStorage).map((k) => localStorage.getItem(k)).join('');
    expect(everything).not.toContain('supersecret');
  });

  it('unsubscribes listeners', async () => {
    const fn = vi.fn();
    const off = auth.onChange(fn);
    off();
    await auth.signUp('mel@wood.app', 'password1');
    expect(fn).not.toHaveBeenCalled();
  });
});
