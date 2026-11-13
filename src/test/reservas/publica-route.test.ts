import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  afterEach(() => {
    vi.restoreAllMocks();
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
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
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
    expect(logSpy).toHaveBeenCalledWith(
      '[POST /api/reservas/publica] cuerpo recibido (valores personales omitidos)',
      expect.objectContaining({
        campos: expect.arrayContaining(['canchaId', 'clienteNuevo', 'fecha', 'horaInicio', 'horaFin']),
        camposCliente: ['nombre', 'contacto', 'email'],
        fecha: '2026-11-20',
        horaInicio: '18:00',
        horaFin: '19:00',
      }),
    );
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain('Cliente Público');
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain('3001234567');
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain('cliente@example.com');
  });

  it('registra metadatos de PostgreSQL si falla la persistencia', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = Object.assign(new Error('column missing'), {
      code: '42703',
      column: 'email',
      table: 'clientes',
      detail: 'sensitive row value',
    });
    crearReservaPublica.mockRejectedValueOnce(error);

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

    expect(response.status).toBe(500);
    const body = await response.json();
    const registro = errorSpy.mock.calls.find(([etiqueta]) => etiqueta === 'DETALLE ERROR SUPABASE:')?.[1];
    expect(typeof registro).toBe('string');
    const detalle = JSON.parse(String(registro));
    expect(detalle).toMatchObject({
      codigo: '42703',
      tabla: 'clientes',
      columna: 'email',
      mensaje: 'column missing',
    });
    expect(JSON.stringify(detalle)).not.toContain('sensitive row value');
    expect(body.error.mensaje).not.toContain('column missing');
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