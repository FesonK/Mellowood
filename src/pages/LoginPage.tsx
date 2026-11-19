import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Button, Input } from '@/ui';
import { AuthLayout } from './AuthLayout';
import { useCredentialsForm } from './useCredentialsForm';

export function LoginPage() {
  const { auth } = useAuth();
  const form = useCredentialsForm((e, p) => auth.signIn(e, p), { validatePasswordRules: false });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Your little garden of knowledge missed you."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-bold text-berry hover:underline">
            Plant your first seed
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.onSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => form.setEmail(e.target.value)}
          error={form.fieldErrors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => form.setPassword(e.target.value)}
          error={form.fieldErrors.password}
        />
        {form.formError && (
          <p role="alert" className="rounded-squish bg-blush/40 px-4 py-3 text-sm font-semibold text-ink">
            {form.formError}
          </p>
        )}
        <Button type="submit" size="lg" loading={form.busy} className="mt-2 w-full">
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
