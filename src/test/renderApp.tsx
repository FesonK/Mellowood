import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ServicesProvider, type AppServices } from '@/app/services';
import { AuthProvider } from '@/auth/AuthContext';
import { MockAuthService } from '@/auth/mockAuth';
import { MemoryRepository } from '@/data/memoryRepository';

export function makeTestServices(overrides: Partial<AppServices> = {}): AppServices {
  return {
    auth: new MockAuthService(localStorage),
    repo: new MemoryRepository(),
    ...overrides,
  };
}

interface Options {
  route?: string;
  services?: AppServices;
  /** Extra routes rendered alongside `ui` so navigation can be asserted. */
  routes?: Record<string, ReactElement>;
  path?: string;
}

export function renderApp(ui: ReactElement, { route = '/', services = makeTestServices(), routes = {}, path }: Options = {}) {
  const result = render(
    <ServicesProvider services={services}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path ?? route.split('?')[0]} element={ui} />
            {Object.entries(routes).map(([p, el]) => (
              <Route key={p} path={p} element={el} />
            ))}
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ServicesProvider>,
  );
  return { ...result, services };
}
