import { MockAuthService, SESSION_TTL_MS } from '../mockAuth';

describe('MockAuthService session persistence', () => {
  it('restores the signed-in user in a new instance (app restart)', async () => {
    await new MockAuthService(localStorage).signUp('mel@wood.app', 'password1');
    const restarted = new MockAuthService(localStorage);
    expect(restarted.current()?.email).toBe('mel@wood.app');
    expect(restarted.signOutReason()).toBeNull();
  });

  it('forgets the session after logout', async () => {
    const auth = new MockAuthService(localStorage);
    await auth.signUp('mel@wood.app', 'password1');
    await auth.signOut();
    expect(new MockAuthService(localStorage).current()).toBeNull();
    expect(auth.signOutReason()).toBe('manual');
  });

  it('drops an expired session and reports why', async () => {
    let now = 1_000;
    await new MockAuthService(localStorage, undefined, () => now).signUp('mel@wood.app', 'password1');
    now += SESSION_TTL_MS + 1;
    const later = new MockAuthService(localStorage, undefined, () => now);
    expect(later.current()).toBeNull();
    expect(later.signOutReason()).toBe('expired');
  });
});
