'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { formatearHora } from '@/lib/formato';
import { esFechaPasada, esFechaValida, esHoraValida } from '@/lib/reglas/fechas';
import type { Cancha, Cliente } from '@/lib/datos/tipos';

type FormularioReservaProps = {
  canchas: Cancha[];
  clientes: Cliente[];
  canchaInicial: string;
  fechaInicial: string;
  hoy: string;
};

type ErrorApi = {
  codigo?: string;
  mensaje?: string;
  detalles?: { conflicto?: { horaInicio?: string; horaFin?: string } };
};

export function FormularioReserva({
  canchas,
  clientes,
  canchaInicial,
  fechaInicial,
  hoy,
}: FormularioReservaProps) {
  const router = useRouter();
  const [canchaId, setCanchaId] = useState(canchaInicial);
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? '');
  const [fecha, setFecha] = useState(fechaInicial);
  const [horaInicio, setHoraInicio] = useState('18:00');
  const [horaFin, setHoraFin] = useState('19:00');
  const [valorTotal, setValorTotal] = useState('50000');
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const errorFecha = !fecha || !esFechaValida(fecha)
    ? 'Ingresa una fecha válida.'
    : esFechaPasada(fecha, hoy)
      ? 'No se puede reservar en una fecha pasada.'
      : undefined;
  const errorHoraInicio = !esHoraValida(horaInicio) ? 'Ingresa una hora válida.' : undefined;
  const errorHoraFin = !esHoraValida(horaFin)
    ? 'Ingresa una hora válida.'
    : esHoraValida(horaInicio) && horaFin <= horaInicio
      ? 'La hora de fin debe ser posterior al inicio.'
      : undefined;
  const errorValor = !Number.isInteger(Number(valorTotal)) || Number(valorTotal) <= 0
    ? 'El valor debe ser un entero mayor que cero.'
    : undefined;

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAviso(null);
    if (errorFecha || errorHoraInicio || errorHoraFin || errorValor || !canchaId || !clienteId) {
      setAviso({ tipo: 'error', texto: 'Revisa los datos marcados antes de guardar.' });
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canchaId,
          clienteId,
          fecha,
          horaInicio,
          horaFin,
          valorTotal: Number(valorTotal),
        }),
      });
      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        const error = resultado.error as ErrorApi | undefined;
        if (error?.codigo === 'CHOQUE_HORARIO') {
          const conflicto = error.detalles?.conflicto;
          const cancha = canchas.find((item) => item.id === canchaId)?.nombre ?? 'La cancha';
          const mensaje = conflicto?.horaInicio && conflicto.horaFin
            ? `${cancha} ya tiene una reserva de ${formatearHora(conflicto.horaInicio)} a ${formatearHora(conflicto.horaFin)} ese día. Elige otro horario.`
            : error.mensaje ?? 'Esa cancha ya está reservada en ese horario.';
          setAviso({ tipo: 'error', texto: mensaje });
        } else {
          setAviso({ tipo: 'error', texto: error?.mensaje ?? 'No se pudo crear la reserva.' });
        }
        return;
      }

      router.push(`/reservas?canchaId=${encodeURIComponent(canchaId)}&fecha=${encodeURIComponent(fecha)}`);
      router.refresh();
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="formulario-panel formulario-reserva" aria-labelledby="formulario-reserva-titulo">
      <div className="seccion-cabecera">
        <div>
          <p className="seccion-kicker">Agenda</p>
          <h2 id="formulario-reserva-titulo">Datos de la reserva</h2>
        </div>
      </div>
      <form className="formulario-reserva-grid" onSubmit={guardar} noValidate>
        <Selector etiqueta="Cancha" value={canchaId} onChange={(evento) => setCanchaId(evento.target.value)} required>
          {canchas.map((cancha) => <option key={cancha.id} value={cancha.id}>{cancha.nombre}</option>)}
        </Selector>
        <Selector etiqueta="Cliente" value={clienteId} onChange={(evento) => setClienteId(evento.target.value)} required>
          {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
        </Selector>
        <Campo etiqueta="Fecha" type="date" min={hoy} value={fecha} onChange={(evento) => setFecha(evento.target.value)} error={errorFecha} required />
        <Campo etiqueta="Hora de inicio" type="time" value={horaInicio} onChange={(evento) => setHoraInicio(evento.target.value)} error={errorHoraInicio} required />
        <Campo etiqueta="Hora de fin" type="time" value={horaFin} onChange={(evento) => setHoraFin(evento.target.value)} error={errorHoraFin} required />
        <Campo etiqueta="Valor total (COP)" type="number" min="1" step="1" inputMode="numeric" value={valorTotal} onChange={(evento) => setValorTotal(evento.target.value)} error={errorValor} required />
        <div className="formulario-reserva-acciones">
          <Link className="boton boton--secundario" href={`/reservas?canchaId=${encodeURIComponent(canchaId)}&fecha=${encodeURIComponent(fecha)}`}>
            Volver a agenda
          </Link>
          <Boton type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Crear reserva'}
          </Boton>
        </div>
      </form>
      {aviso && <Aviso tono={aviso.tipo}>{aviso.texto}</Aviso>}
    </section>
  );
}