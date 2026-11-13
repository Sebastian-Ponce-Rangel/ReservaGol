import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const { replace, refresh, fetchMock } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    replace.mockClear();
    refresh.mockClear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows field errors when submitted empty or with an invalid email', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument();
  });

  it('inicia sesión y navega al panel del propietario', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, datos: { email: 'demo@reservagol.com' } }),
    });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'demo@reservagol.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'demo1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin'));
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }));
    expect(refresh).toHaveBeenCalled();
  });

  it('shows an authentication error for other credentials', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        ok: false,
        error: { codigo: 'NO_AUTORIZADO', mensaje: 'Correo o contraseña incorrectos' },
      }),
    });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'otra@persona.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'incorrecta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
    expect(replace).not.toHaveBeenCalled();
  });
});