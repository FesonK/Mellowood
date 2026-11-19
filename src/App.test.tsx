import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the Mellowood brand', () => {
    render(<App />);
    expect(screen.getAllByText(/mellowood/i).length).toBeGreaterThan(0);
  });
});
