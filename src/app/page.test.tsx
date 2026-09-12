import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the Hola Mundo page title', () => {
    render(<HomePage />);
    expect(screen.getByText('Hola Mundo')).toBeInTheDocument();
  });
});
