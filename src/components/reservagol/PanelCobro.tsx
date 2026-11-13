'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Modal } from '@/components/ui/Modal';
import { InsigniaEstadoPago } from '@/components/reservagol/InsigniaEstadoPago';
import { InsigniaEstadoReserva } from '@/components/reservagol/InsigniaEstadoReserva';
import { formatearFecha, formatearHora, formatearPesos } from '@/lib/formato';
import type { ReservaConCobro } from '@/lib/datos/tipos';

type PanelCobroProps = {
  reserva: ReservaConCobro;
};

export function PanelCobro({ reserva }: PanelCobroProps) {
  const router = useRouter();
  const [monto, setMonto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [cancelacionAbierta, setCancelacionAbierta] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  async function registrarAbono(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAviso(null);
    setOcupado(true);
    try {
      const respuesta = await fetch(`/api/reservas/${reserva.id}/abonos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: Number(monto) }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) {
        setAviso({ tipo: 'error', texto: resultado.error?.mensaje ?? 'No se pudo registrar el abono.' });
        return;
      }

      setMonto('');
      setAviso({ tipo: 'exito', texto: 'Abono registrado.' });
      router.refresh();
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    } finally {
      setOcupado(false);
    }
  }

  async function cancelarReserva() {
    setOcupado(true);
    setAviso(null);
    try {
      const respuesta = await fetch(`/api/reservas/${reserva.id}/cancelar`, { method: 'POST' });
      const resultado = await respuesta.json();
      if (!respuesta.ok) {
        setAviso({ tipo: 'error', texto: resultado.error?.mensaje ?? 'No se pudo cancelar la reserva.' });
        return;
      }

      setCancelacionAbierta(false);
      setAviso({ tipo: 'exito', texto: 'Reserva cancelada. La franja quedó libre.' });
      router.refresh();
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    } finally {
      setOcupado(false);
    }
  }

  const textoConfirmacion = `Cancelar la reserva de ${reserva.clienteNombre} el ${formatearFecha(reserva.fecha)} de ${formatearHora(reserva.horaInicio)} a ${formatearHora(reserva.horaFin)}. El horario quedará libre.`;

  return (
    <div className="detalle-reserva">
      <section className="detalle-cabecera" aria-labelledby="detalle-reserva-titulo">
        <div>
          <p className="seccion-kicker">Reserva</p>
          <h1 id="detalle-reserva-titulo">{reserva.canchaNombre}</h1>
          <p className="detalle-subtitulo">
            {formatearFecha(reserva.fecha)} · {formatearHora(reserva.horaInicio)}–{formatearHora(reserva.horaFin)}
          </p>
          <p className="detalle-cliente">{reserva.clienteNombre}</p>
          {reserva.metodoAnticipo && (
            <p className="detalle-subtitulo">
              Anticipo acordado: {reserva.metodoAnticipo === 'transferencia' ? 'Transferencia' : 'Pago en sede'}
            </p>
          )}
        </div>
        <InsigniaEstadoReserva estado={reserva.estado} />
      </section>

      <section className="cobro-panel" aria-labelledby="cobro-titulo">
        <div className="seccion-cabecera">
          <h2 id="cobro-titulo">Cobro</h2>
          <InsigniaEstadoPago estado={reserva.cobro.estadoPago} />
        </div>
        <dl className="cobro-resumen">
          <div><dt>Total</dt><dd>{formatearPesos(reserva.cobro.total)}</dd></div>
          <div><dt>Abonado</dt><dd>{formatearPesos(reserva.cobro.abonado)}</dd></div>
          <div><dt>Saldo</dt><dd>{formatearPesos(reserva.cobro.saldo)}</dd></div>
        </dl>

        {reserva.estado === 'activa' && reserva.cobro.saldo > 0 && (
          <form className="abono-formulario" onSubmit={registrarAbono}>
            <Campo
              etiqueta="Registrar abono (COP)"
              type="number"
              min="1"
              max={reserva.cobro.saldo}
              step="1"
              inputMode="numeric"
              value={monto}
              onChange={(evento) => setMonto(evento.target.value)}
              required
            />
            <Boton type="submit" disabled={ocupado}>
              {ocupado ? 'Guardando...' : 'Registrar abono'}
            </Boton>
          </form>
        )}

        <div className="abonos-seccion">
          <h3>Abonos registrados</h3>
          {reserva.cobro.abonos.length === 0 ? (
            <p className="texto-secundario">Aún no hay abonos.</p>
          ) : (
            <ul className="abonos-lista">
              {reserva.cobro.abonos.map((abono) => (
                <li key={abono.id}>
                  <span>{formatearFecha(abono.fecha)}</span>
                  <strong>{formatearPesos(abono.monto)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="detalle-acciones">
        {reserva.estado === 'activa' && (
          <Boton variante="peligro" type="button" onClick={() => setCancelacionAbierta(true)}>
            Cancelar reserva
          </Boton>
        )}
        {aviso && <Aviso tono={aviso.tipo}>{aviso.texto}</Aviso>}
      </div>

      <Modal
        abierto={cancelacionAbierta}
        titulo="Confirmar cancelación"
        confirmar="Cancelar reserva"
        alCerrar={() => setCancelacionAbierta(false)}
        alConfirmar={cancelarReserva}
        ocupado={ocupado}
      >
        <p>{textoConfirmacion}</p>
      </Modal>
    </div>
  );
}