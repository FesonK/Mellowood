import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JourneyPage } from '../JourneyPage';
import { makeTestServices, renderApp } from '@/test/renderApp';
import type { Goal } from '@/domain/goal';
import { robotGraph } from '@/domain/graph/__tests__/fixtures';

const base: Goal = {
  id: 'g1',
  status: 'confirmed',
  summary: { title: 'Robot arm', endGoal: 'Build a robot arm', domain: 'Robotics', constraints: [] },
  messages: [],
  createdAt: '2026-11-19T00:00:00.000Z',
  graph: robotGraph,
};

async function setup(goal: Goal) {
  const services = makeTestServices();
  await services.auth.signUp('mel@wood.app', 'password1');
  const userId = services.auth.current()!.id;
  await services.repo.put(userId, 'goals', goal);
  renderApp(<JourneyPage />, { route: '/goal/g1', path: '/goal/:goalId', services });
  const saved = () => services.repo.get<Goal>(userId, 'goals', 'g1');
  return { saved };
}

describe('skip and redo placement', () => {
  it('"Start me from scratch" skips the questions with zero mastery', async () => {
    const { saved } = await setup(base);
    await userEvent.click(await screen.findByRole('button', { name: /start me from scratch/i }));
    await waitFor(async () => {
      const g = await saved();
      expect(g?.placement?.skipped).toBe(true);
      expect(Object.values(g!.placement!.mastery).every((v) => v === 0)).toBe(true);
    });
  });

  it('"Redo placement" re-runs it and never lowers mastery', async () => {
    const { saved } = await setup({
      ...base,
      placement: { mastery: { 'basics/variables': 0.8 }, weeklyHours: 3, skipped: false, completedAt: 'x' },
    });
    await userEvent.click(await screen.findByRole('button', { name: /redo placement/i }));
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    while (screen.queryByRole('button', { name: /not yet/i })) {
      await userEvent.click(screen.getByRole('button', { name: /not yet/i }));
    }
    await waitFor(async () => {
      const g = await saved();
      expect(g?.placement?.completedAt).not.toBe('x');
      expect(g?.placement?.mastery['basics/variables']).toBe(0.8);
    });
  });
});
