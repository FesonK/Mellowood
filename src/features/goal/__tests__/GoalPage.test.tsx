import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'react-router-dom';
import { GoalPage } from '../GoalPage';
import { makeTestServices, renderApp } from '@/test/renderApp';
import type { Goal } from '@/domain/goal';

function GoalProbe() {
  return <p>goal {useParams().goalId}</p>;
}

async function signedInServices() {
  const services = makeTestServices();
  await services.auth.signUp('mel@wood.app', 'password1');
  return services;
}

const specific = 'I want to build a robot arm that sorts Lego, 5 hours a week with an Arduino';

describe('GoalPage', () => {
  it('shows the summary card once the goal is clear and saves it on confirm', async () => {
    const services = await signedInServices();
    renderApp(<GoalPage />, {
      route: `/goal/new?q=${encodeURIComponent(specific)}`,
      path: '/goal/new',
      services,
      routes: { '/goal/:goalId': <GoalProbe /> },
    });
    await userEvent.click(await screen.findByRole('button', { name: /looks right/i }));
    const goals = await services.repo.list<Goal>(services.auth.current()!.id, 'goals');
    expect(goals).toHaveLength(1);
    expect(goals[0]).toMatchObject({ status: 'confirmed', summary: { domain: 'Robotics' } });
    expect(await screen.findByText(`goal ${goals[0].id}`)).toBeInTheDocument();
  });

  it('reopens the conversation when the user says "Not quite"', async () => {
    const services = await signedInServices();
    renderApp(<GoalPage />, { route: `/goal/new?q=${encodeURIComponent(specific)}`, path: '/goal/new', services });
    await userEvent.click(await screen.findByRole('button', { name: /not quite/i }));
    expect(screen.queryByRole('button', { name: /looks right/i })).not.toBeInTheDocument();
    expect(screen.getByText(/what should i change/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your answer/i)).toBeInTheDocument();
  });
});
