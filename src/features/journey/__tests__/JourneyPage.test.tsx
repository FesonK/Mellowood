import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JourneyPage } from '../JourneyPage';
import { makeTestServices, renderApp } from '@/test/renderApp';
import type { Goal } from '@/domain/goal';
import { loadMastery } from '@/domain/mastery/masteryStore';

const goal: Goal = {
  id: 'g1',
  status: 'confirmed',
  summary: { title: 'Robot arm', endGoal: 'Build a robot arm that sorts Lego', domain: 'Robotics', constraints: [] },
  messages: [],
  createdAt: '2026-11-19T00:00:00.000Z',
};

async function setup() {
  const services = makeTestServices();
  await services.auth.signUp('mel@wood.app', 'password1');
  const userId = services.auth.current()!.id;
  await services.repo.put(userId, 'goals', goal);
  return { services, userId };
}

describe('JourneyPage', () => {
  it('generates the graph, runs placement, and saves the results', async () => {
    const { services, userId } = await setup();
    renderApp(<JourneyPage />, { route: '/goal/g1', path: '/goal/:goalId', services });

    await userEvent.click(await screen.findByRole('button', { name: /continue/i }));
    while (screen.queryByRole('button', { name: /not yet/i })) {
      await userEvent.click(screen.getByRole('button', { name: /not yet/i }));
    }

    await waitFor(async () => {
      const saved = await services.repo.get<Goal>(userId, 'goals', 'g1');
      expect(saved?.graph?.concepts.length).toBeGreaterThan(5);
      expect(saved?.placement?.weeklyHours).toBe(5);
    });
    expect(await loadMastery(services.repo, userId)).toEqual({});
  });

  it('shows a friendly not-found state for unknown goals', async () => {
    const { services } = await setup();
    renderApp(<JourneyPage />, { route: '/goal/nope', path: '/goal/:goalId', services });
    expect(await screen.findByText(/couldn.t find that goal/i)).toBeInTheDocument();
  });
});
