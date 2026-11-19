import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '../LoginPage';
import { SignUpPage } from '../SignUpPage';
import { RequireAuth } from '@/auth/RequireAuth';
import { makeTestServices, renderApp } from '@/test/renderApp';

const home = <p>Landing home</p>;

describe('SignUpPage', () => {
  it('shows inline errors for an invalid email and a short password', async () => {
    renderApp(<SignUpPage />, { route: '/signup', routes: { '/': home } });
    await userEvent.type(screen.getByLabelText('Email'), 'nope');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: /create my account/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/8 characters/i)).toBeInTheDocument();
  });

  it('creates the account and lands on the goal landing page', async () => {
    renderApp(<SignUpPage />, { route: '/signup', routes: { '/': home } });
    await userEvent.type(screen.getByLabelText('Email'), 'mel@wood.app');
    await userEvent.type(screen.getByLabelText('Password'), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /create my account/i }));
    expect(await screen.findByText('Landing home')).toBeInTheDocument();
  });
});

describe('LoginPage', () => {
  it('shows a gentle generic error for wrong credentials', async () => {
    const services = makeTestServices();
    await services.auth.signUp('mel@wood.app', 'password1');
    await services.auth.signOut();
    renderApp(<LoginPage />, { route: '/login', services, routes: { '/': home } });
    await userEvent.type(screen.getByLabelText('Email'), 'mel@wood.app');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/don.t match/i);
  });

  it('logs in and lands on the landing page', async () => {
    const services = makeTestServices();
    await services.auth.signUp('mel@wood.app', 'password1');
    await services.auth.signOut();
    renderApp(<LoginPage />, { route: '/login', services, routes: { '/': home } });
    await userEvent.type(screen.getByLabelText('Email'), 'mel@wood.app');
    await userEvent.type(screen.getByLabelText('Password'), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Landing home')).toBeInTheDocument();
  });
});

describe('RequireAuth', () => {
  it('redirects anonymous visitors to /login', async () => {
    renderApp(
      <RequireAuth>
        <p>Secret garden</p>
      </RequireAuth>,
      { route: '/track', routes: { '/login': <p>Please log in</p> } },
    );
    expect(await screen.findByText('Please log in')).toBeInTheDocument();
    expect(screen.queryByText('Secret garden')).not.toBeInTheDocument();
  });

  it('renders children for signed-in users', async () => {
    const services = makeTestServices();
    await services.auth.signUp('mel@wood.app', 'password1');
    renderApp(
      <RequireAuth>
        <p>Secret garden</p>
      </RequireAuth>,
      { route: '/track', services },
    );
    await waitFor(() => expect(screen.getByText('Secret garden')).toBeInTheDocument());
  });
});
