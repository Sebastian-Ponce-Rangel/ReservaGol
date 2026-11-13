import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgendaSemanal } from '@/components/reservagol/AgendaSemanal';
import type { Cancha, Cliente } from '@/lib/datos/tipos';

const { refresh, fetchMock } = vi.hoisted(() => ({
  refresh: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

const CANCHA: Cancha = {
  id: '98b5f05a-7f6d-4c35-96a1-e338d770c09a',
  nombre: 'Cancha Norte',
  precioHora: 50000,
  activa: true,
};

const CLIENTE: Cliente = {
  id: 'f53851d6-b065-4f4f-865c-2aa8604c0a3e',
  nombre: 'Cliente Demo',
  contacto: '3001234567',
  activo: true,
};

const FECHAS = [
  '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12',
  '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17',
];

describe('AgendaSemanal', () => {
  beforeEach(() => {
    refresh.mockClear();
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, datos: { id: 'reserva-creada' } }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('selecciona una franja libre y confirma mediante la API existente', async () => {
    render(
      <AgendaSemanal
        canchas={[CANCHA]}
        clientes={[CLIENTE]}
        canchaInicial={CANCHA.id}
        fechaReferencia={FECHAS[0] ?? '2026-11-09'}
        hoy="2026-11-09"
        fechas={FECHAS}
        reservas={[]}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /libre/i })[0]!);
    expect(screen.getByText('SEDE FIJADA')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reserva Cancha Norte' })).toBeInTheDocument();
    expect(screen.getByText(/Dirección de sede por confirmar/)).toBeInTheDocument();
    expect(screen.getByText('09/11/2026 al 15/11/2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '7 días →' })).toHaveAttribute(
      'href',
      `/reservas?canchaId=${CANCHA.id}&fecha=2026-11-16`,
    );
    expect(screen.getByText('← 7 días')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('heading', { name: 'Tu Reserva' })).toBeInTheDocument();
    expect(screen.getAllByText('Cancha Norte')).toHaveLength(2);
    expect(screen.queryByLabelText('Valor total de la reserva (COP)')).not.toBeInTheDocument();
    expect(screen.getAllByText(/50\.000/)).toHaveLength(2);
    expect(screen.getByText(/12\.500/)).toBeInTheDocument();
    expect(screen.getByText('Cliente Demo')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/acepto el tratamiento/i));
    fireEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/reservas', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canchaId: CANCHA.id,
        clienteId: CLIENTE.id,
        fecha: '2026-11-09',
        horaInicio: '06:00',
        horaFin: '07:00',
        valorTotal: 50000,
        metodoAnticipo: 'transferencia',
        politicasAceptadas: true,
      }),
    })));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it('envía los datos de un cliente nuevo con correo y consentimiento', async () => {
    render(
      <AgendaSemanal
        canchas={[CANCHA]}
        clientes={[CLIENTE]}
        canchaInicial={CANCHA.id}
        fechaReferencia={FECHAS[0] ?? '2026-11-09'}
        hoy="2026-11-09"
        fechas={FECHAS}
        reservas={[]}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /libre/i })[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo cliente' }));
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Prueba' } });
    fireEvent.change(screen.getByLabelText('WhatsApp'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } });
    fireEvent.click(screen.getByLabelText(/acepto el tratamiento/i));
    fireEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/reservas', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        canchaId: CANCHA.id,
        clienteNuevo: { nombre: 'Ana Prueba', contacto: '3001234567', email: 'ana@example.com' },
        fecha: '2026-11-09',
        horaInicio: '06:00',
        horaFin: '07:00',
        valorTotal: 50000,
        metodoAnticipo: 'transferencia',
        politicasAceptadas: true,
      }),
    })));
  });

  it('oculta las columnas anteriores al día actual', () => {
    render(
      <AgendaSemanal
        canchas={[CANCHA]}
        clientes={[CLIENTE]}
        canchaInicial={CANCHA.id}
        fechaReferencia={FECHAS[0] ?? '2026-11-09'}
        hoy="2026-11-11"
        fechas={FECHAS}
        reservas={[]}
      />,
    );

    expect(screen.queryByRole('columnheader', { name: /lun 09\/11/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /mar 10\/11/i })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /mié 11\/11/i })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(8);
  });

  it('no permite confirmar si la cancha no tiene tarifa configurada en el flujo administrativo heredado', () => {
    render(
      <AgendaSemanal
        canchas={[{ ...CANCHA, precioHora: null }]}
        clientes={[CLIENTE]}
        canchaInicial={CANCHA.id}
        fechaReferencia={FECHAS[0] ?? '2026-11-09'}
        hoy="2026-11-09"
        fechas={FECHAS}
        reservas={[]}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /libre/i })[0]!);
    expect(screen.getByText('Tarifa no configurada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar reserva/i })).toBeDisabled();
  });
});