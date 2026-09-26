import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import HomePage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('HomePage', () => {
  it('renders the login screen at the home route', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
  });
});
