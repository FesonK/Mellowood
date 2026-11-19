import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useServices } from '@/app/services';
import type { AuthService, AuthUser } from './types';

interface AuthState {
  user: AuthUser | null;
  auth: AuthService;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useServices();
  const [user, setUser] = useState<AuthUser | null>(() => auth.current());

  useEffect(() => {
    setUser(auth.current());
    return auth.onChange(setUser);
  }, [auth]);

  return <AuthContext.Provider value={{ user, auth }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error('useAuth must be used inside <AuthProvider>');
  return state;
}
