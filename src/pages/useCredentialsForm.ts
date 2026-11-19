import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AuthResult } from '@/auth/types';
import { validateEmail, validatePassword } from '@/auth/validation';

interface FieldErrors {
  email?: string;
  password?: string;
}

/** Shared state for email/password forms: inline validation, submit, error, redirect. */
export function useCredentialsForm(
  submit: (email: string, password: string) => Promise<AuthResult>,
  { validatePasswordRules = true, onSuccess }: { validatePasswordRules?: boolean; onSuccess?: (r: AuthResult) => boolean } = {},
) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const errors: FieldErrors = {
      email: validateEmail(email) ?? undefined,
      password: validatePasswordRules ? (validatePassword(password) ?? undefined) : password ? undefined : 'Please enter your password.',
    };
    setFieldErrors(errors);
    setFormError(null);
    if (errors.email || errors.password) return;
    setBusy(true);
    const result = await submit(email, password);
    setBusy(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    if (onSuccess?.(result)) return;
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from && from !== '/login' ? from : '/', { replace: true });
  };

  return { email, setEmail, password, setPassword, fieldErrors, formError, busy, onSubmit };
}
