import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from '../AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { MockAuthService, SESSION_TTL_MS } from '@/auth/mockAuth';
import { makeTestServices, renderApp } from '@/test/renderApp';

describe('AppShell user menu', () => {
  it('logs out from the user menu and returns to /login', async () => {
    const services = makeTestServices();
    await services.auth.signUp('mel@wood.app', 'password1');
    renderApp(
      <AppShell>
        <p>Inside</p>
      </AppShell>,
      { services, routes: { '/login': <p>Login screen</p> } },
    );
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /log out/i }));
    expect(await screen.findByText('Login screen')).toBeInTheDocument();
    expect(services.auth.current()).toBeNull();
  });

  it('shows the user initial on the avatar', async () => {
    const services = makeTestServices();
    await services.auth.signUp('mel@wood.app', 'password1');
    renderApp(<AppShell>x</AppShell>, { services });
    expect(screen.getByRole('button', { name: /account menu/i })).toHaveTextContent('M');
  });
});

describe('expired session notice', () => {
  it('shows a soft notice on the login page when the session expired', async () => {
    let now = 0;
    await new MockAuthService(localStorage, undefined, () => now).signUp('mel@wood.app', 'password1');
    now = SESSION_TTL_MS + 5;
    const services = makeTestServices({ auth: new MockAuthService(localStorage, undefined, () => now) });
    renderApp(<LoginPage />, { route: '/login', services });
    expect(screen.getByRole('status')).toHaveTextContent(/session took a nap/i);
  });
});
