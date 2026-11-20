import { useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/app/AppShell';
import { createServices, ServicesProvider, type AppServices } from '@/app/services';
import { AuthProvider } from '@/auth/AuthContext';
import { RequireAuth } from '@/auth/RequireAuth';
import { GoalPage } from '@/features/goal/GoalPage';
import { JourneyPage } from '@/features/journey/JourneyPage';
import { TaskPage } from '@/features/task/TaskPage';
import { LandingPage } from '@/features/landing/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignUpPage } from '@/pages/SignUpPage';

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
              <LandingPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/goal/new"
        element={
          <RequireAuth>
            <AppShell>
              <GoalPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/goal/:goalId"
        element={
          <RequireAuth>
            <AppShell>
              <JourneyPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/goal/:goalId/task"
        element={
          <RequireAuth>
            <AppShell>
              <TaskPage />
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
