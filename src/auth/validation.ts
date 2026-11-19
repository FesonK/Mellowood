const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function validateEmail(email: string): string | null {
  return EMAIL.test(email.trim()) ? null : 'Please enter a valid email address.';
}

export const MIN_PASSWORD = 8;

export function validatePassword(password: string): string | null {
  return password.length >= MIN_PASSWORD ? null : `Passwords need at least ${MIN_PASSWORD} characters.`;
}
