import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalPage } from '../GoalPage';
import { loadDraft, saveDraft } from '../draft';
import { LandingPage } from '@/features/landing/LandingPage';
import { makeTestServices, renderApp } from '@/test/renderApp';

async function signedIn() {
  const services = makeTestServices();
  await services.auth.signUp('mel@wood.app', 'password1');
  return { services, userId: services.auth.current()!.id };
}

describe('goal drafts', () => {
  it('autosaves the conversation after each message', async () => {
    const { services, userId } = await signedIn();
    renderApp(<GoalPage />, { route: '/goal/new?q=learn%20AI', path: '/goal/new', services });
    await screen.findByText(/build or do/i);
    await waitFor(async () => {
      const draft = await loadDraft(services.repo, userId);
      expect(draft?.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    });
  });

  it('clears the draft once the goal is confirmed', async () => {
    const { services, userId } = await signedIn();
    renderApp(<GoalPage />, {
      route: `/goal/new?q=${encodeURIComponent('build a robot arm, 5 hours a week')}`,
      path: '/goal/new',
      services,
      routes: { '/goal/:goalId': <p>goal saved</p> },
    });
    await userEvent.click(await screen.findByRole('button', { name: /looks right/i }));
    await screen.findByText('goal saved');
    expect(await loadDraft(services.repo, userId)).toBeNull();
  });

  it('resumes a saved draft', async () => {
    const { services, userId } = await signedIn();
    await saveDraft(services.repo, userId, [
      { role: 'user', content: 'learn pottery' },
      { role: 'assistant', content: 'What do you want to build or do?' },
    ]);
    renderApp(<GoalPage />, { route: '/goal/new?resume=1', path: '/goal/new', services });
    expect(await screen.findByText('learn pottery')).toBeInTheDocument();
    expect(screen.getByLabelText(/your answer/i)).toBeInTheDocument();
  });

  it('offers to continue or discard the draft on the landing page', async () => {
    const { services, userId } = await signedIn();
    await saveDraft(services.repo, userId, [{ role: 'user', content: 'learn pottery' }]);
    renderApp(<LandingPage />, { services, routes: { '/goal/new': <p>resumed</p> } });
    const card = await screen.findByRole('region', { name: /continue your draft/i });
    expect(card).toHaveTextContent('learn pottery');
    await userEvent.click(screen.getByRole('button', { name: /discard/i }));
    await waitFor(() => expect(screen.queryByRole('region', { name: /continue your draft/i })).not.toBeInTheDocument());
    expect(await loadDraft(services.repo, userId)).toBeNull();
  });

  it('continues the draft from the landing page', async () => {
    const { services, userId } = await signedIn();
    await saveDraft(services.repo, userId, [{ role: 'user', content: 'learn pottery' }]);
    renderApp(<LandingPage />, { services, routes: { '/goal/new': <p>resumed</p> } });
    await userEvent.click(await screen.findByRole('button', { name: /^continue$/i }));
    expect(await screen.findByText('resumed')).toBeInTheDocument();
  });
});
