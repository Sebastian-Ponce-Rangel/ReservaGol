import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReservasLayout from '@/app/reservas/layout';

const { obtenerSesion } = vi.hoisted(() => ({ obtenerSesion: vi.fn() }));
vi.mock('@/lib/auth/sesion', () => ({ obtenerSesion }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/reservas/canchas',
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

describe('ReservasLayout', () => {
  it('mantiene la navegación del propietario en las vistas de gestión con sesión', async () => {
    obtenerSesion.mockResolvedValue({ email: 'propietario@example.com' });
    render(await ReservasLayout({ children: <p>Gestión de canchas</p> }));

    expect(screen.getByRole('link', { name: 'Contaduría' })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: 'Canchas' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Clientes' })).toHaveAttribute('href', '/reservas/clientes');
    expect(screen.getByRole('link', { name: 'Resumen' })).toHaveAttribute('href', '/reservas/resumen');
    expect(screen.getByRole('link', { name: 'ReservaGol, agenda' })).toBeInTheDocument();
  });

  it('conserva la navegación pública sin sesión', async () => {
    obtenerSesion.mockResolvedValue(null);
    render(await ReservasLayout({ children: <p>Reservas públicas</p> }));

    expect(screen.getByRole('link', { name: 'Soy Propietario' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('link', { name: 'Contaduría' })).not.toBeInTheDocument();
  });
});
