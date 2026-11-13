import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/reservas/resumen/route';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

const { exigirSesion, resumenCobros } = vi.hoisted(() => ({
  exigirSesion: vi.fn(),
  resumenCobros: vi.fn(),
}));

vi.mock('@/lib/auth/sesion', () => ({ exigirSesion }));
vi.mock('@/lib/dataService', () => ({ resumenCobros }));

describe('GET /api/reservas/resumen', () => {
  beforeEach(() => {
    exigirSesion.mockReset().mockResolvedValue(undefined);
    resumenCobros.mockReset().mockResolvedValue({
      desde: '2026-11-01',
      hasta: '2026-11-30',
      totalCobrado: 70000,
      totalReservas: 3,
      porEstado: { pendiente: 1, anticipo: 1, pagado: 1 },
    });
  });

  it('devuelve el resumen para un rango válido y evita caché', async () => {
    const respuesta = await GET(new Request(
      'http://localhost/api/reservas/resumen?desde=2026-11-01&hasta=2026-11-30',
    ));

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get('Cache-Control')).toBe('no-store');
    expect(await respuesta.json()).toMatchObject({
      ok: true,
      datos: { totalCobrado: 70000, totalReservas: 3 },
    });
    expect(resumenCobros).toHaveBeenCalledWith('2026-11-01', '2026-11-30');
  });

  it('rechaza un rango invertido', async () => {
    const respuesta = await GET(new Request(
      'http://localhost/api/reservas/resumen?desde=2026-11-30&hasta=2026-11-01',
    ));

    expect(respuesta.status).toBe(400);
    expect(resumenCobros).not.toHaveBeenCalled();
  });

  it('exige sesión antes de procesar los parámetros', async () => {
    exigirSesion.mockRejectedValue(new ErrorDeNegocio('NO_AUTORIZADO'));
    const respuesta = await GET(new Request('http://localhost/api/reservas/resumen'));

    expect(respuesta.status).toBe(401);
    expect(resumenCobros).not.toHaveBeenCalled();
  });
});