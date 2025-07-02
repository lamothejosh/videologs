import { render, screen } from '@testing-library/react';
import App from './App';

test('renders header text', () => {
  render(<App />);
  const headerElement = screen.getByRole('heading', { name: /notes/i });
  expect(headerElement).toBeInTheDocument();
});
