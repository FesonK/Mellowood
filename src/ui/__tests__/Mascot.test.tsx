import { render, screen } from '@testing-library/react';
import { Mascot, type MascotMood } from '../Mascot';

describe('Mascot', () => {
  const moods: MascotMood[] = ['happy', 'thinking', 'cheering', 'sleepy'];
  it.each(moods)('renders an accessible %s Mellow', (mood) => {
    render(<Mascot mood={mood} />);
    expect(screen.getByRole('img', { name: new RegExp(`mellow.*${mood}`, 'i') })).toBeInTheDocument();
  });
});
