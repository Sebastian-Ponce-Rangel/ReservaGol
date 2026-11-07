import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from './page';

const { redirect, obtenerSesion } = vi.hoisted(() => ({
  redirect: vi.fn(),
  obtenerSesion: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect,
}));

vi.mock('@/lib/auth/sesion', () => ({
  obtenerSesion,
}));

describe('HomePage', () => {
  beforeEach(() => {
    redirect.mockClear();
    obtenerSesion.mockReset();
  });

  it('redirige al login sin sesión', async () => {
    obtenerSesion.mockResolvedValue(null);
    await HomePage();
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirige a reservas con sesión', async () => {
    obtenerSesion.mockResolvedValue({ email: 'admin@reservagol.com' });
    await HomePage();
    expect(redirect).toHaveBeenCalledWith('/reservas');
  });
});
