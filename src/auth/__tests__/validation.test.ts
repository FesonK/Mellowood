import { validateEmail, validatePassword } from '../validation';

describe('validateEmail', () => {
  it.each(['a@b.co', 'first.last+tag@mellowood.app'])('accepts %s', (email) => {
    expect(validateEmail(email)).toBeNull();
  });
  it.each(['', 'nope', 'a@b', '@b.co', 'a b@c.co'])('rejects "%s" with a friendly message', (email) => {
    expect(validateEmail(email)).toMatch(/email/i);
  });
});

describe('validatePassword', () => {
  it('requires at least 8 characters', () => {
    expect(validatePassword('short')).toMatch(/8 characters/);
    expect(validatePassword('longenough')).toBeNull();
  });
});
