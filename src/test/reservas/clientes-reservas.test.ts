import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listarClientesConReservas } from '@/lib/datos/clientes';

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock('@/lib/db/conexion', () => ({ consultar }));

describe('listarClientesConReservas', () => {
  beforeEach(() => {
    consultar.mockReset().mockResolvedValue([
      {
        id: 'cliente-1',
        nombre: 'Ana Prueba',
        contacto: '3001234567',
        email: 'ana@example.com',
        activo: true,
        reservaId: 'reserva-1',
        canchaNombre: 'Cancha Norte',
        fecha: '2026-11-20',
        horaInicio: '18:00',
        horaFin: '19:00',
        valorTotal: '80000',
        anticipoRequerido: true,
        estado: 'activa',
        abonado: '20000',
      },
      {
        id: 'cliente-2',
        nombre: 'Sin Reserva',
        contacto: '3007654321',
        email: null,
        activo: true,
        reservaId: null,
        canchaNombre: null,
        fecha: null,
        horaInicio: null,
        horaFin: null,
        valorTotal: null,
        anticipoRequerido: false,
        estado: null,
        abonado: null,
      },
    ]);
  });

  it('lee reservas de la vista compartida y calcula total, anticipo y saldo', async () => {
    const clientes = await listarClientesConReservas({ incluirInactivos: true });

    expect(consultar).toHaveBeenCalledWith(
      expect.stringContaining('LEFT JOIN v_reservas r ON r.cliente_id = c.id'),
      [true, expect.any(Number)],
    );
    expect(clientes).toEqual([
      {
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
      },
      {
        id: 'cliente-2',
        nombre: 'Sin Reserva',
        contacto: '3007654321',
        email: null,
        activo: true,
        reservas: [],
      },
    ]);
  });
});
