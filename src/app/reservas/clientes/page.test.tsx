import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ClientesPage from './page';

const { listarClientesConReservas } = vi.hoisted(() => ({ listarClientesConReservas: vi.fn() }));
vi.mock('@/lib/dataService', () => ({ listarClientesConReservas }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe('ClientesPage', () => {
  it('muestra contacto, reserva y valores de cobro asociados al cliente', async () => {
    listarClientesConReservas.mockResolvedValue([{
      id: 'cliente-1',
      nombre: 'Ana Prueba',
      contacto: '3001234567',
      email: 'ana@example.com',
      activo: true,
      reservas: [{
        id: 'reserva-1',
        canchaNombre: 'Cancha Norte',
        fecha: '2026-11-20',
        horaInicio: '18:00',
        horaFin: '19:00',
        valorTotal: 80000,
        anticipoRequerido: 20000,
        abonado: 20000,
        saldo: 60000,
        estado: 'activa',
        estadoPago: 'anticipo',
      }],
    }]);

    render(await ClientesPage());

    expect(screen.getByText('Ana Prueba')).toBeInTheDocument();
    expect(screen.getByText('Teléfono: 3001234567')).toBeInTheDocument();
    expect(screen.getByText('Correo: ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('Cancha Norte')).toBeInTheDocument();
    expect(screen.getByText('18:00–19:00')).toBeInTheDocument();
    expect(screen.getByText(/80\.000/)).toBeInTheDocument();
    expect(screen.getByText('Anticipo')).toBeInTheDocument();
  });
});
