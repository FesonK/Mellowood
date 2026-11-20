import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskPage } from '../TaskPage';
import { makeTestServices, renderApp } from '@/test/renderApp';
import type { Goal } from '@/domain/goal';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';
import { loadMastery } from '@/domain/mastery/masteryStore';

const goal: Goal = {
  id: 'g1',
  status: 'active',
  summary: { title: 'Robot arm', endGoal: 'Build a robot arm', domain: 'Robotics', constraints: [] },
  messages: [],
  createdAt: 'x',
  graph: robotGraph,
};

describe('task loop', () => {
  it('reflects on a task, grows mastery, celebrates and serves the next task', async () => {
    const services = makeTestServices();
    await services.auth.signUp('mel@wood.app', 'password1');
    const userId = services.auth.current()!.id;
    await services.repo.put(userId, 'goals', goal);
    renderApp(<TaskPage />, { route: '/goal/g1/task', path: '/goal/:goalId/task', services });

    expect(await screen.findByRole('heading', { level: 2, name: /variables/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /i.m done/i }));
    await userEvent.click(screen.getByRole('radio', { name: /nailed it/i }));
    await userEvent.click(screen.getByRole('button', { name: /finish task/i }));

    expect(await screen.findByRole('status', { name: /task complete/i })).toHaveTextContent(/\+50%/);
    await waitFor(async () => expect((await loadMastery(services.repo, userId))['basics/variables']).toBe(0.5));
    expect(await screen.findByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /finish task/i })).not.toBeInTheDocument();
  });
});
