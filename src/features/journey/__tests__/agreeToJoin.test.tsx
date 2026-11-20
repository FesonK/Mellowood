import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JourneyPage } from '../JourneyPage';
import { TaskPage } from '@/features/task/TaskPage';
import { makeTestServices, renderApp } from '@/test/renderApp';
import type { Goal } from '@/domain/goal';
import type { Track } from '@/domain/track/track';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';
import { loadStrategy } from '@/domain/strategy/strategyStore';

const goal: Goal = {
  id: 'g1',
  status: 'confirmed',
  summary: { title: 'Robot arm', endGoal: 'Build a robot arm', domain: 'Robotics', constraints: [] },
  messages: [],
  createdAt: '2026-11-19T00:00:00.000Z',
  graph: robotGraph,
  placement: { mastery: { 'basics/variables': 0.8 }, weeklyHours: 5, skipped: false, completedAt: 'x' },
};

async function setup(g: Goal = goal) {
  const services = makeTestServices();
  await services.auth.signUp('mel@wood.app', 'password1');
  const userId = services.auth.current()!.id;
  await services.repo.put(userId, 'goals', g);
  await services.repo.put(userId, 'mastery', { id: 'basics/variables', value: 0.8, updatedAt: 'x' });
  return { services, userId };
}

describe('Agree to join', () => {
  it('creates the active track and strategy, then opens the first task', async () => {
    const { services, userId } = await setup();
    renderApp(<JourneyPage />, {
      route: '/goal/g1',
      path: '/goal/:goalId',
      services,
      routes: { '/goal/:goalId/task': <p>first task</p> },
    });
    await userEvent.click(await screen.findByRole('button', { name: /agree to join/i }));
    expect(await screen.findByText('first task')).toBeInTheDocument();

    const track = await services.repo.get<Track>(userId, 'tracks', 'g1');
    expect(track?.steps.map((s) => s.conceptId)).not.toContain('basics/variables');
    expect((await services.repo.get<Goal>(userId, 'goals', 'g1'))?.status).toBe('active');
    expect(await loadStrategy(services.repo, userId, goal.id, robotGraph, {})).not.toBeNull();
  });

  it('offers "Continue learning" once the goal is active', async () => {
    const { services } = await setup({ ...goal, status: 'active' });
    renderApp(<JourneyPage />, { route: '/goal/g1', path: '/goal/:goalId', services });
    expect(await screen.findByRole('link', { name: /continue learning/i })).toHaveAttribute('href', '/goal/g1/task');
  });
});

describe('TaskPage', () => {
  it('shows the next task chosen by the strategy and keeps it stable across visits', async () => {
    const { services } = await setup();
    const generateTask = vi.spyOn(services.ai, 'generateTask');
    renderApp(<JourneyPage />, {
      route: '/goal/g1',
      path: '/goal/:goalId',
      services,
      routes: { '/goal/:goalId/task': <TaskPage /> },
    });
    await userEvent.click(await screen.findByRole('button', { name: /agree to join/i }));
    // strategy: after variables, ohms-law unlocks the most
    expect(await screen.findByRole('heading', { name: /ohms law/i, level: 2 })).toBeInTheDocument();
    await waitFor(() => expect(generateTask).toHaveBeenCalledTimes(1));
  });
});
