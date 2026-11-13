import { beforeEach, describe, expect, it, vi } from 'vitest';
import { agendaDelDia, resumenAdministrador, resumenCobros } from '@/lib/datos/resumen';

const { consultar, listarCanchas, listarReservas } = vi.hoisted(() => ({
  consultar: vi.fn(),
  listarCanchas: vi.fn(),
  listarReservas: vi.fn(),
}));

vi.mock('@/lib/db/conexion', () => ({ consultar }));
vi.mock('@/lib/datos/canchas', () => ({ listarCanchas }));
vi.mock('@/lib/datos/reservas', () => ({ listarReservas }));

describe('resúmenes de reservas', () => {
  beforeEach(() => {
    consultar.mockReset();
    listarCanchas.mockReset();
    listarReservas.mockReset();
  });

  it('incluye todas las canchas y solo reservas activas en la agenda', async () => {
    listarCanchas.mockResolvedValue([
      { id: 'cancha-activa', nombre: 'Cancha Activa' },
      { id: 'cancha-inactiva', nombre: 'Cancha Inactiva' },
    ]);
    listarReservas.mockResolvedValue([
      { id: 'reserva-1', canchaId: 'cancha-activa', estado: 'activa' },
    ]);

    const agenda = await agendaDelDia('2026-11-08');

    expect(listarCanchas).toHaveBeenCalledWith({ incluirInactivas: true });
    expect(listarReservas).toHaveBeenCalledWith({ fecha: '2026-11-08', estado: 'activa' });
    expect(agenda.canchas).toEqual([
      { canchaId: 'cancha-activa', canchaNombre: 'Cancha Activa', reservas: [expect.objectContaining({ id: 'reserva-1' })] },
      { canchaId: 'cancha-inactiva', canchaNombre: 'Cancha Inactiva', reservas: [] },
    ]);
  });

  it('suma abonos y cuenta estados del periodo incluyendo reservas canceladas', async () => {
    consultar.mockResolvedValue([{
      totalCobrado: '70000',
      totalReservas: 3,
      pendiente: 1,
      anticipo: 1,
      pagado: 1,
    }]);

    const resumen = await resumenCobros('2026-11-01', '2026-11-30');

    expect(consultar).toHaveBeenCalledWith(expect.stringContaining('WHERE fecha BETWEEN $1 AND $2'), [
      '2026-11-01',
      '2026-11-30',
    ]);
    expect(resumen).toEqual({
      desde: '2026-11-01',
      hasta: '2026-11-30',
      totalCobrado: 70000,
      totalReservas: 3,
      porEstado: { pendiente: 1, anticipo: 1, pagado: 1 },
    });
  });

  it('calcula las métricas de contaduría desde la vista compartida de reservas', async () => {
    consultar.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM canchas c')) {
        return [{ canchaId: 'cancha-1', canchaNombre: 'Cancha Norte', alquileres: '2', ingresos: '25000' }];
      }
      if (sql.includes('JOIN clientes c')) {
        return [{
          id: 'reserva-1',
          clienteNombre: 'Ana Pérez',
          clienteContacto: '3001234567',
          clienteEmail: 'ana@example.com',
          canchaNombre: 'Cancha Norte',
          fecha: '2026-11-08',
          horaInicio: '09:00',
          horaFin: '10:00',
          valorTotal: '100000',
          anticipoRequerido: true,
          abonado: '25000',
          estado: 'activa',
        }];
      }
      return [{
        totalAlquileres: '3',
        alquileresActivos: '2',
        ingresos: '25000',
        canchasAlquiladas: '1',
      }];
    });

    const resumen = await resumenAdministrador('2026-11-01', '2026-11-30');

    expect(consultar.mock.calls[0]?.[0]).toContain('FROM v_reservas');
    expect(consultar.mock.calls[0]?.[1]).toEqual(['2026-11-01', '2026-11-30']);
    expect(consultar.mock.calls[2]?.[0]).toContain('JOIN clientes c');
    expect(consultar.mock.calls[2]?.[1]).toEqual(['2026-11-01', '2026-11-30', 10]);
    expect(resumen).toEqual({
      desde: '2026-11-01',
      hasta: '2026-11-30',
      totalAlquileres: 3,
      alquileresActivos: 2,
      ingresos: 25000,
      canchasAlquiladas: 1,
      reservas: [{
        id: 'reserva-1',
        clienteNombre: 'Ana Pérez',
        clienteContacto: '3001234567',
        clienteEmail: 'ana@example.com',
        canchaNombre: 'Cancha Norte',
        fecha: '2026-11-08',
        horaInicio: '09:00',
        horaFin: '10:00',
        valorTotal: 100000,
        anticipoRequerido: 25000,
        abonado: 25000,
        saldo: 75000,
        estado: 'activa',
        estadoPago: 'anticipo',
      }],
      porCancha: [{ canchaId: 'cancha-1', canchaNombre: 'Cancha Norte', alquileres: 2, ingresos: 25000 }],
    });
  });
});