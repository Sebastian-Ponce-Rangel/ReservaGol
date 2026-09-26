import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('shows field errors when submitted empty or with an invalid email', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument();
  });

  it('navigates to reservations with the demo credentials', async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'demo@reservagol.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'demo1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled();
    await waitFor(() => expect(push).toHaveBeenCalledWith('/reservas'));
  });

  it('shows an authentication error for other credentials', async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'otra@persona.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'incorrecta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
    expect(push).not.toHaveBeenCalled();
  });
});