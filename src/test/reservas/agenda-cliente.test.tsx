import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgendaCliente } from '@/components/reservagol/AgendaCliente';
import type { Cancha } from '@/lib/datos/tipos';

const { refresh, fetchMock } = vi.hoisted(() => ({ refresh: vi.fn(), fetchMock: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const CANCHA: Cancha = {
  id: '98b5f05a-7f6d-4c35-96a1-e338d770c09a',
  nombre: 'Cancha Norte',
  precioHora: null,
  activa: true,
};
const FECHAS = ['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18'];

describe('AgendaCliente', () => {
  beforeEach(() => {
    refresh.mockClear();
    fetchMock.mockReset().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => String(url).includes('?desde=')
        ? {
          ok: true,
          datos: {
            ocupadas: [{
              canchaId: CANCHA.id,
              fecha: '2026-11-12',
              horaInicio: '06:00',
              horaFin: '07:00',
            }],
          },
        }
        : { ok: true, datos: { id: 'reserva-1', valorTotal: 60000, anticipoRequerido: 15000 } },
    }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('calcula tarifa base y anticipo, habilita CTA y envía sin precio manual', async () => {
    render(<AgendaCliente canchas={[CANCHA]} ocupadas={[]} fechas={FECHAS} hoy="2026-11-12" canchaInicial={CANCHA.id} />);

    fireEvent.click(screen.getAllByRole('button', { name: /libre/i })[0]!);
    expect(screen.getByText(/60\.000\/h \(tarifa base\)/)).toBeInTheDocument();
    expect(screen.getByText(/15\.000/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/valor total/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Prueba' } });
    fireEvent.change(screen.getByLabelText('WhatsApp'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } });
    fireEvent.click(screen.getByLabelText(/acepto el tratamiento/i));
    const boton = screen.getByRole('button', { name: 'Solicitar reserva' });
    expect(boton).toBeEnabled();
    fireEvent.click(boton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/reservas/publica', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        canchaId: CANCHA.id,
        clienteNuevo: { nombre: 'Ana Prueba', contacto: '3001234567', email: 'ana@example.com' },
        fecha: '2026-11-12',
        horaInicio: '06:00',
        horaFin: '07:00',
        metodoAnticipo: 'transferencia',
        politicasAceptadas: true,
      }),
    })));
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).not.toHaveProperty('valorTotal');
    expect(await screen.findByRole('button', { name: /06:00 ocupada/i })).toBeDisabled();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/reservas/publica?desde='),
      expect.objectContaining({ cache: 'no-store' }),
    ));
  });

  it('actualiza las celdas libres cuando otra reserva aparece en el servidor', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        datos: {
          ocupadas: [{
            canchaId: CANCHA.id,
            fecha: '2026-11-12',
            horaInicio: '06:00',
            horaFin: '07:00',
          }],
        },
      }),
    });
    vi.useFakeTimers();
    render(<AgendaCliente canchas={[CANCHA]} ocupadas={[]} fechas={FECHAS} hoy="2026-11-12" canchaInicial={CANCHA.id} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/reservas/publica?desde=2026-11-12&hasta=2026-11-18',
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(screen.getByRole('button', { name: /06:00 ocupada/i })).toBeDisabled();
  });
});