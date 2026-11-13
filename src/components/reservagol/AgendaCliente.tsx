'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { DIRECCION_SEDE, HORA_APERTURA, HORA_CIERRE, PRECIO_HORA_BASE } from '@/lib/config/reservagol';
import { formatearFecha, formatearHora, formatearPesos } from '@/lib/formato';
import type { BloqueOcupadoPublico, Cancha } from '@/lib/datos/tipos';

type Props = {
  canchas: Cancha[];
  ocupadas: BloqueOcupadoPublico[];
  fechas: string[];
  hoy: string;
  canchaInicial: string;
};

type Seleccion = { fecha: string; horaInicio: string; horaFin: string };
type MetodoAnticipo = 'transferencia' | 'efectivo';

const DIA = new Intl.DateTimeFormat('es-CO', { weekday: 'short', timeZone: 'UTC' });
const FECHA_CORTA = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const FECHA_RANGO = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

function etiquetaDia(fecha: string) {
  const date = new Date(`${fecha}T12:00:00Z`);
  const dia = DIA.format(date).replace(/\.$/, '');
  return `${dia.charAt(0).toLocaleUpperCase('es-CO')}${dia.slice(1)} ${FECHA_CORTA.format(date)}`;
}

function horasDelDia() {
  const inicio = Number(HORA_APERTURA.slice(0, 2));
  const fin = Number(HORA_CIERRE.slice(0, 2));
  return Array.from({ length: fin - inicio }, (_, indice) => `${String(inicio + indice).padStart(2, '0')}:00`);
}

function sumarDias(fecha: string, dias: number) {
  const resultado = new Date(`${fecha}T00:00:00Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

export function AgendaCliente({ canchas, ocupadas, fechas, hoy, canchaInicial }: Props) {
  const router = useRouter();
  const [canchaId, setCanchaId] = useState(canchaInicial);
  const [bloquesOcupados, setBloquesOcupados] = useState(ocupadas);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState(false);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [metodoAnticipo, setMetodoAnticipo] = useState<MetodoAnticipo>('transferencia');
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [confirmacion, setConfirmacion] = useState<{ total: number; anticipo: number } | null>(null);
  const cancha = canchas.find((item) => item.id === canchaId);
  const visibles = fechas.filter((fecha) => fecha >= hoy).slice(0, 7);
  const inicioRango = visibles[0] ?? hoy;
  const finRango = visibles[visibles.length - 1] ?? hoy;
  const horas = horasDelDia();
  const duracionHoras = seleccion
    ? (Number(seleccion.horaFin.slice(0, 2)) - Number(seleccion.horaInicio.slice(0, 2)))
    : 0;
  const tarifaPorHora = cancha?.precioHora ?? PRECIO_HORA_BASE;
  const total = cancha && duracionHoras > 0 ? tarifaPorHora * duracionHoras : 0;
  const anticipo = total > 0 ? Math.ceil(total * 0.25) : 0;
  const puedeAnterior = inicioRango > hoy;

  function seleccionarFranja(fecha: string, horaInicio: string, horaFin: string) {
    const ocupada = bloquesOcupados.some((bloque) =>
      bloque.canchaId === canchaId &&
      bloque.fecha === fecha &&
      bloque.horaInicio < horaFin &&
      horaInicio < bloque.horaFin
    );
    if (!cancha || fecha < hoy || ocupada) return;
    setSeleccion({ fecha, horaInicio, horaFin });
    setConfirmacion(null);
    setAviso(null);
  }

  const actualizarDisponibilidad = useCallback(async (signal?: AbortSignal) => {
    const parametros = new URLSearchParams({ desde: inicioRango, hasta: finRango });
    try {
      const response = await fetch(`/api/reservas/publica?${parametros.toString()}`, {
        cache: 'no-store',
        ...(signal ? { signal } : {}),
      });
      const resultado = await response.json() as {
        ok?: boolean;
        datos?: { ocupadas?: BloqueOcupadoPublico[] };
      };
      if (!response.ok || !resultado.ok || !Array.isArray(resultado.datos?.ocupadas)) {
        throw new Error('Respuesta inválida al consultar disponibilidad.');
      }
      setBloquesOcupados(resultado.datos.ocupadas);
      setErrorDisponibilidad(false);
    } catch (error) {
      if (!signal?.aborted) {
        console.error('No se pudo consultar la disponibilidad pública.', error);
        setErrorDisponibilidad(true);
      }
    }
  }, [finRango, inicioRango]);

  useEffect(() => {
    const controller = new AbortController();
    const intervalo = window.setInterval(() => {
      void actualizarDisponibilidad(controller.signal);
    }, 5000);
    return () => {
      window.clearInterval(intervalo);
      controller.abort();
    };
  }, [actualizarDisponibilidad]);

  async function confirmar() {
    if (!cancha || !seleccion || !nombre.trim() || !whatsapp.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || !aceptaPrivacidad || total <= 0) {
      setAviso({ tipo: 'error', texto: 'Completa tus datos, verifica que haya tarifa y acepta las políticas.' });
      return;
    }
    setGuardando(true);
    setAviso(null);
    try {
      const response = await fetch('/api/reservas/publica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canchaId,
          clienteNuevo: { nombre: nombre.trim(), contacto: whatsapp.trim(), email: email.trim() },
          fecha: seleccion.fecha,
          horaInicio: seleccion.horaInicio,
          horaFin: seleccion.horaFin,
          metodoAnticipo,
          politicasAceptadas: true,
        }),
      });
      const resultado = await response.json() as {
        datos?: { valorTotal?: unknown; anticipoRequerido?: unknown };
        error?: { codigo?: string; mensaje?: string };
      };
      if (!response.ok) {
        console.error('El servidor rechazó la reserva.', {
          status: response.status,
          codigo: resultado.error?.codigo,
        });
        setAviso({ tipo: 'error', texto: resultado.error?.mensaje ?? 'No se pudo completar la reserva.' });
        router.refresh();
        return;
      }
      const valorTotal = resultado.datos?.valorTotal;
      const anticipoRequerido = resultado.datos?.anticipoRequerido;
      if (
        typeof valorTotal !== 'number' ||
        !Number.isSafeInteger(valorTotal) ||
        typeof anticipoRequerido !== 'number' ||
        !Number.isSafeInteger(anticipoRequerido)
      ) {
        throw new Error('Respuesta inválida al confirmar la reserva.');
      }
      setConfirmacion({ total: valorTotal, anticipo: anticipoRequerido });
      setBloquesOcupados((actuales) => [
        ...actuales,
        {
          canchaId,
          fecha: seleccion.fecha,
          horaInicio: seleccion.horaInicio,
          horaFin: seleccion.horaFin,
        },
      ]);
      setSeleccion(null);
      setAviso({ tipo: 'exito', texto: 'Recibimos tu solicitud de reserva.' });
      void actualizarDisponibilidad();
      router.refresh();
    } catch (error) {
      console.error('No se pudo completar la solicitud de reserva.', error);
      setAviso({ tipo: 'error', texto: 'No fue posible conectar con el servidor.' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="app-contenido public-booking">
      <header className="public-booking-hero">
        <span className="agenda-sede-badge">SEDE FIJADA</span>
        <p>ReservaGol · Reservas en línea</p>
        <h1>Tu próxima cancha empieza aquí</h1>
        <div><MapPin size={16} aria-hidden="true" />{DIRECCION_SEDE}</div>
      </header>

      <section className="public-booking-filtros" aria-label="Seleccionar cancha y fecha">
        <Selector etiqueta="Cancha" value={canchaId} onChange={(event) => { setCanchaId(event.target.value); setSeleccion(null); setConfirmacion(null); }}>
          {canchas.map((item) => <option value={item.id} key={item.id}>{item.nombre}</option>)}
        </Selector>
        <div className="agenda-semana-navegacion">
          {puedeAnterior ? <a className="agenda-semana-boton" href={`/reservas?canchaId=${canchaId}&fecha=${sumarDias(inicioRango, -7)}`}>← 7 días</a> : <span className="agenda-semana-boton agenda-semana-boton--desactivado">← 7 días</span>}
          <p>{FECHA_RANGO.format(new Date(`${inicioRango}T12:00:00Z`))} al {FECHA_RANGO.format(new Date(`${finRango}T12:00:00Z`))}</p>
          <a className="agenda-semana-boton" href={`/reservas?canchaId=${canchaId}&fecha=${sumarDias(inicioRango, 7)}`}>7 días →</a>
        </div>
      </section>

      {confirmacion && (
        <section className="public-booking-confirmada" role="status">
          <strong>Solicitud recibida</strong>
          <span>Total: {formatearPesos(confirmacion.total)} · Anticipo pendiente: {formatearPesos(confirmacion.anticipo)}</span>
        </section>
      )}
      {errorDisponibilidad && (
        <Aviso tono="error" role="status">
          No se pudo actualizar la disponibilidad. Se intentará de nuevo automáticamente.
        </Aviso>
      )}

      {!cancha ? (
        <EstadoVacio
          titulo={canchas.length === 0 ? 'No hay canchas disponibles' : 'Selecciona una cancha'}
          detalle={canchas.length === 0
            ? 'El propietario debe registrar una cancha activa antes de habilitar reservas.'
            : 'Selecciona una cancha activa para consultar sus horarios disponibles.'}
        />
      ) : (
      <div className={seleccion ? 'agenda-board agenda-board--seleccionada' : 'agenda-board'}>
        <section className="agenda-matriz rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="disponibilidad-publica">
          <div className="seccion-cabecera">
            <h2 id="disponibilidad-publica">Disponibilidad</h2>
            <div className="agenda-leyenda"><span className="agenda-badge agenda-badge--libre">Libre</span><span className="agenda-badge agenda-badge--ocupada">Ocupada</span></div>
          </div>
          <div className="agenda-matriz-scroll">
            <table className="agenda-matriz-tabla">
              <thead><tr><th className="agenda-columna-hora" scope="col">Hora</th>{visibles.map((fecha) => <th className="agenda-dia" scope="col" key={fecha}>{etiquetaDia(fecha)}{fecha === hoy && <span className="agenda-hoy">Hoy</span>}</th>)}</tr></thead>
              <tbody>{horas.map((horaInicio) => {
                const horaFin = `${String(Number(horaInicio.slice(0, 2)) + 1).padStart(2, '0')}:00`;
                return <tr key={horaInicio}><th className="agenda-hora" scope="row">{formatearHora(horaInicio)}</th>{visibles.map((fecha) => {
                  const ocupada = bloquesOcupados.some((bloque) => bloque.canchaId === canchaId && bloque.fecha === fecha && bloque.horaInicio < horaFin && horaInicio < bloque.horaFin);
                  const activa = seleccion?.fecha === fecha && seleccion.horaInicio === horaInicio;
                  return <td key={fecha}><button className={`agenda-celda ${ocupada ? 'agenda-celda--ocupada' : 'agenda-celda--libre'}${activa ? ' agenda-celda--seleccionada' : ''}`} type="button" disabled={ocupada || fecha < hoy || !cancha} aria-label={`${etiquetaDia(fecha)} ${formatearHora(horaInicio)} ${ocupada ? 'ocupada' : 'libre'}`} onClick={() => seleccionarFranja(fecha, horaInicio, horaFin)}><span className={`agenda-badge ${ocupada ? 'agenda-badge--ocupada' : 'agenda-badge--libre'}`}>{ocupada ? 'Ocupada' : 'Libre'}</span></button></td>;
                })}</tr>;
              })}</tbody>
            </table>
          </div>
        </section>

        {seleccion && cancha && <aside className="agenda-reserva-panel rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="tu-reserva-publica">
          <p className="seccion-kicker">Paso 2 · Confirma tus datos</p>
          <h2 id="tu-reserva-publica">Tu reserva</h2>
          <dl className="agenda-reserva-datos"><div><dt>Cancha</dt><dd>{cancha.nombre}</dd></div><div><dt>Fecha</dt><dd>{formatearFecha(seleccion.fecha)}</dd></div><div><dt>Horario</dt><dd>{formatearHora(seleccion.horaInicio)}–{formatearHora(seleccion.horaFin)}</dd></div></dl>
          <div className="agenda-datos-cliente">
            <Campo etiqueta="Nombre completo" autoComplete="name" value={nombre} onChange={(event) => setNombre(event.target.value)} required />
            <Campo etiqueta="WhatsApp" type="tel" autoComplete="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} required />
            <Campo etiqueta="Correo electrónico" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <Selector etiqueta="Método de anticipo" value={metodoAnticipo} onChange={(event) => setMetodoAnticipo(event.target.value as MetodoAnticipo)}><option value="transferencia">Transferencia</option><option value="efectivo">Pago en sede</option></Selector>
          <div className="agenda-total"><div><span>Total · {duracionHoras} h × {formatearPesos(tarifaPorHora)}/h{cancha?.precioHora == null ? ' (tarifa base)' : ''}</span><strong>{total ? formatearPesos(total) : 'No disponible'}</strong></div><div className="agenda-anticipo"><span>Anticipo (25%)</span><strong>{anticipo ? formatearPesos(anticipo) : 'No disponible'}</strong></div></div>
          <label className="agenda-privacidad"><input type="checkbox" checked={aceptaPrivacidad} onChange={(event) => setAceptaPrivacidad(event.target.checked)} /><span>Acepto el tratamiento de mis datos personales para gestionar esta reserva.</span></label>
          <Boton type="button" className="agenda-confirmar" onClick={confirmar} disabled={guardando || !total || !nombre.trim() || !whatsapp.trim() || !email.trim() || !aceptaPrivacidad}>{guardando ? 'Enviando...' : 'Solicitar reserva'}</Boton>
          {aviso && <Aviso tono={aviso.tipo} role="status">{aviso.texto}</Aviso>}
        </aside>}
      </div>
      )}
    </main>
  );
}