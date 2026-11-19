import { useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/app/AppShell';
import { createServices, ServicesProvider, type AppServices } from '@/app/services';
import { AuthProvider } from '@/auth/AuthContext';
import { RequireAuth } from '@/auth/RequireAuth';
import { LoginPage } from '@/pages/LoginPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { Mascot } from '@/ui';

function HomePlaceholder() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 p-6 text-center">
      <Mascot mood="cheering" size={140} />
      <h1 className="text-5xl font-bold">Mellowood</h1>
      <p className="text-ink-soft">Learn anything, one cozy step at a time.</p>
    </main>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell>
              <HomePlaceholder />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App({ services }: { services?: AppServices }) {
  const resolved = useMemo(() => services ?? createServices(), [services]);
  return (
    <ServicesProvider services={resolved}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ServicesProvider>
  );
}
