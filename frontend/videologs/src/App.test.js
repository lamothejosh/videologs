import { render, screen } from '@testing-library/react';
import App from './App';

test('renders header text', () => {
  render(<App />);
  const headerElement = screen.getByText(/Video Logs Frontend/i);
  expect(headerElement).toBeInTheDocument();
});
