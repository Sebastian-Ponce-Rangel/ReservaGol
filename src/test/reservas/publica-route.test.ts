import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/reservas/publica/route';

const { crearReservaPublica, listarBloquesOcupadosPublicos, listarCanchas } = vi.hoisted(() => ({
  crearReservaPublica: vi.fn(),
  listarBloquesOcupadosPublicos: vi.fn(),
  listarCanchas: vi.fn(),
}));

vi.mock('@/lib/dataService', () => ({ crearReservaPublica, listarBloquesOcupadosPublicos, listarCanchas }));

describe('API pública de reservas', () => {
  beforeEach(() => {
    crearReservaPublica.mockReset().mockResolvedValue({ id: 'reserva-1', valorTotal: 50000 });
    listarCanchas.mockReset().mockResolvedValue([{ id: 'cancha-1', nombre: 'Cancha Norte', precioHora: 50000, activa: true }]);
    listarBloquesOcupadosPublicos.mockReset().mockResolvedValue([
      { canchaId: 'cancha-1', fecha: '2026-11-20', horaInicio: '18:00', horaFin: '19:00' },
    ]);
  });

  it('entrega disponibilidad sin datos de clientes y limita el rango a siete días', async () => {
    const response = await GET(new Request('http://localhost/api/reservas/publica?desde=2026-11-20&hasta=2026-11-26'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.datos.ocupadas[0]).toEqual({
      canchaId: 'cancha-1', fecha: '2026-11-20', horaInicio: '18:00', horaFin: '19:00',
    });
    expect(JSON.stringify(body)).not.toContain('cliente');
    expect(listarBloquesOcupadosPublicos).toHaveBeenCalledWith('2026-11-20', '2026-11-26');

    const largo = await GET(new Request('http://localhost/api/reservas/publica?desde=2026-11-20&hasta=2026-11-28'));
    expect(largo.status).toBe(400);
  });

  it('crea una reserva pública con total calculado en servidor y sin revelar datos personales', async () => {
    const response = await POST(new Request('http://localhost/api/reservas/publica', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost' },
      body: JSON.stringify({
        canchaId: '98b5f05a-7f6d-4c35-96a1-e338d770c09a',
        clienteNuevo: { nombre: 'Cliente Público', contacto: '3001234567', email: 'cliente@example.com' },
        fecha: '2026-11-20', horaInicio: '18:00', horaFin: '19:00',
        metodoAnticipo: 'transferencia', politicasAceptadas: true,
      }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.datos).toEqual({ id: 'reserva-1', valorTotal: 50000, anticipoRequerido: 12500, estadoPago: 'pendiente' });
    expect(JSON.stringify(body)).not.toContain('cliente@example.com');
    expect(crearReservaPublica).toHaveBeenCalledWith(expect.objectContaining({ horaInicio: '18:00' }));
  });

  it('rechaza origen cruzado', async () => {
    const response = await POST(new Request('http://localhost/api/reservas/publica', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://otro-sitio.example' },
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(403);
    expect(crearReservaPublica).not.toHaveBeenCalled();
  });

  it('rechaza solicitudes de navegador que no incluyen origen', async () => {
    const response = await POST(new Request('http://localhost/api/reservas/publica', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(403);
    expect(crearReservaPublica).not.toHaveBeenCalled();
  });
});