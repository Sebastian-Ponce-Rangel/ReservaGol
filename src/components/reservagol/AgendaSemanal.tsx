'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Selector } from '@/components/ui/Selector';
import { formatearFecha, formatearHora, formatearPesos } from '@/lib/formato';
import { DIRECCION_SEDE, HORA_APERTURA, HORA_CIERRE } from '@/lib/config/reservagol';
import type { Cancha, Cliente, Reserva } from '@/lib/datos/tipos';

type AgendaSemanalProps = {
  canchas: Cancha[];
  clientes: Cliente[];
  canchaInicial: string;
  fechaReferencia: string;
  hoy: string;
  fechas: string[];
  reservas: Reserva[];
};

type Seleccion = {
  fecha: string;
  horaInicio: string;
  horaFin: string;
};

type MetodoAnticipo = 'transferencia' | 'efectivo';
type ModoCliente = 'existente' | 'nuevo';

type ErrorApi = {
  codigo?: string;
  mensaje?: string;
};

const FORMATO_DIA = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  timeZone: 'UTC',
});

const FORMATO_FECHA_CORTA = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

const FORMATO_FECHA_RANGO = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

function horasDelDia(): string[] {
  const inicio = Number(HORA_APERTURA.slice(0, 2));
  const fin = Number(HORA_CIERRE.slice(0, 2));
  return Array.from({ length: fin - inicio }, (_, indice) =>
    `${String(inicio + indice).padStart(2, '0')}:00`,
  );
}

function reservasDeLaFranja(
  reservas: Reserva[],
  canchaId: string,
  fecha: string,
  horaInicio: string,
  horaFin: string,
): Reserva[] {
  return reservas.filter((reserva) =>
    reserva.canchaId === canchaId &&
    reserva.fecha === fecha &&
    reserva.horaInicio < horaFin &&
    horaInicio < reserva.horaFin,
  );
}

function etiquetaDia(fecha: string): string {
  const dia = FORMATO_DIA.format(new Date(`${fecha}T12:00:00.000Z`)).replace(/\.$/, '');
  const diaCapitalizado = `${dia.charAt(0).toLocaleUpperCase('es-CO')}${dia.slice(1)}`;
  return `${diaCapitalizado} ${FORMATO_FECHA_CORTA.format(new Date(`${fecha}T12:00:00.000Z`))}`;
}

function sumarDias(fecha: string, dias: number): string {
  const resultado = new Date(`${fecha}T00:00:00.000Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

function minutosDeHora(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number);
  return (horas ?? 0) * 60 + (minutos ?? 0);
}

export function AgendaSemanal({
  canchas,
  clientes,
  canchaInicial,
  fechaReferencia,
  hoy,
  fechas,
  reservas,
}: AgendaSemanalProps) {
  const router = useRouter();
  const [canchaId, setCanchaId] = useState(canchaInicial);
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? '');
  const [modoCliente, setModoCliente] = useState<ModoCliente>(clientes.length ? 'existente' : 'nuevo');
  const [nombreCliente, setNombreCliente] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [correo, setCorreo] = useState('');
  const [metodoAnticipo, setMetodoAnticipo] = useState<MetodoAnticipo>('transferencia');
  const [politicasAceptadas, setPoliticasAceptadas] = useState(false);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const canchaSeleccionada = canchas.find((cancha) => cancha.id === canchaId);
  const fechasVisibles = fechas.filter((fecha) => fecha >= hoy).slice(0, 7);
  const horas = horasDelDia();
  const inicioRango = fechasVisibles[0] ?? fechaReferencia;
  const finRango = fechasVisibles[fechasVisibles.length - 1] ?? fechaReferencia;
  const puedeRetroceder = fechaReferencia > hoy;
  const fechaAnterior = puedeRetroceder ? sumarDias(fechaReferencia, -7) : hoy;
  const fechaSiguiente = sumarDias(fechaReferencia, 7);
  const tarifaPorHora = canchaSeleccionada?.precioHora ?? null;
  const duracionHoras = seleccion
    ? (minutosDeHora(seleccion.horaFin) - minutosDeHora(seleccion.horaInicio)) / 60
    : 0;
  const valorNumerico = tarifaPorHora !== null && duracionHoras > 0
    ? Math.round(tarifaPorHora * duracionHoras)
    : 0;
  const valorValido = Number.isInteger(valorNumerico) && valorNumerico > 0;
  const anticipoRequerido = valorValido ? Math.ceil(valorNumerico * 0.25) : 0;

  function seleccionarFranja(fecha: string, horaInicio: string) {
    if (!canchaSeleccionada || fecha < hoy) return;
    const horaFin = `${String(Number(horaInicio.slice(0, 2)) + 1).padStart(2, '0')}:00`;
    setSeleccion({ fecha, horaInicio, horaFin });
    setAviso(null);
  }

  async function confirmarReserva() {
    const clienteNuevoValido = Boolean(nombreCliente.trim() && whatsapp.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()));
    const clienteExistenteValido = modoCliente === 'existente' && Boolean(clienteId);
    if (!seleccion || !canchaSeleccionada || !valorValido || (!clienteNuevoValido && !clienteExistenteValido) || !politicasAceptadas) {
      setAviso({ tipo: 'error', texto: 'Completa los datos del cliente, verifica la tarifa y acepta las políticas para continuar.' });
      return;
    }

    setGuardando(true);
    setAviso(null);
    try {
      const datosReserva = {
        canchaId,
        ...(modoCliente === 'nuevo'
          ? { clienteNuevo: { nombre: nombreCliente.trim(), contacto: whatsapp.trim(), email: correo.trim() } }
          : { clienteId }),
        fecha: seleccion.fecha,
        horaInicio: seleccion.horaInicio,
        horaFin: seleccion.horaFin,
        valorTotal: valorNumerico,
        metodoAnticipo,
        politicasAceptadas: true as const,
      };
      const respuesta = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosReserva),
      });
      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        const error = resultado.error as ErrorApi | undefined;
        setAviso({
          tipo: 'error',
          texto: error?.codigo === 'CHOQUE_HORARIO'
            ? 'La franja acaba de ocuparse. Actualiza la agenda y elige otra.'
            : error?.mensaje ?? 'No se pudo confirmar la reserva.',
        });
        router.refresh();
        return;
      }

      setAviso({
        tipo: 'exito',
        texto: `Reserva confirmada. El anticipo de ${formatearPesos(anticipoRequerido)} está pendiente de pago.`,
      });
      setSeleccion(null);
      router.refresh();
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="app-contenido">
      <header className="agenda-hero">
        <div className="agenda-hero-contenido">
          <div>
            <span className="agenda-sede-badge">SEDE FIJADA</span>
            <p className="agenda-hero-kicker">ReservaGol · Disponibilidad en línea</p>
            <h1>Reserva {canchaSeleccionada?.nombre ?? 'Cancha Principal'}</h1>
            <p className="agenda-hero-descripcion"><MapPin aria-hidden="true" size={15} />{DIRECCION_SEDE} · Cancha sintética</p>
          </div>
          <Link
            className="boton boton--primario"
            href={`/reservas/nueva?canchaId=${encodeURIComponent(canchaId)}&fecha=${encodeURIComponent(fechaReferencia)}`}
          >
            Nueva reserva
          </Link>
        </div>
      </header>

      <form className="agenda-semana-filtros rounded-xl border border-slate-200 bg-white p-5 shadow-sm" action="/reservas" method="get">
        <Selector
          etiqueta="Cancha"
          name="canchaId"
          value={canchaId}
          onChange={(evento) => {
            setCanchaId(evento.target.value);
            setSeleccion(null);
          }}
          required
          disabled={canchas.length === 0}
        >
          {canchas.map((cancha) => <option key={cancha.id} value={cancha.id}>{cancha.nombre}</option>)}
        </Selector>
        <Campo etiqueta="Semana de" name="fecha" type="date" min={hoy} defaultValue={fechaReferencia} required />
        <Boton variante="secundario" type="submit">Ver semana</Boton>
      </form>

      {canchas.length === 0 ? (
        <EstadoVacio titulo="No hay canchas activas" detalle="Agrega una cancha para consultar disponibilidad." />
      ) : (
        <>
          <div className={seleccion ? 'agenda-board agenda-board--seleccionada' : 'agenda-board'}>
            <section className="agenda-matriz rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="matriz-titulo">
              <div className="seccion-cabecera">
                <h2 id="matriz-titulo">Disponibilidad</h2>
                <div className="agenda-leyenda" aria-label="Leyenda de disponibilidad">
                  <span className="agenda-badge agenda-badge--libre">Libre</span>
                  <span className="agenda-badge agenda-badge--ocupada">Ocupada</span>
                </div>
              </div>
              <div className="agenda-semana-navegacion" aria-label="Navegación de siete días">
                {puedeRetroceder ? (
                  <Link
                    className="agenda-semana-boton"
                    href={`/reservas?canchaId=${encodeURIComponent(canchaId)}&fecha=${encodeURIComponent(fechaAnterior)}`}
                  >
                    ← 7 días
                  </Link>
                ) : (
                  <span className="agenda-semana-boton agenda-semana-boton--desactivado" aria-disabled="true">← 7 días</span>
                )}
                <p>{FORMATO_FECHA_RANGO.format(new Date(`${inicioRango}T12:00:00.000Z`))} al {FORMATO_FECHA_RANGO.format(new Date(`${finRango}T12:00:00.000Z`))}</p>
                <Link
                  className="agenda-semana-boton"
                  href={`/reservas?canchaId=${encodeURIComponent(canchaId)}&fecha=${encodeURIComponent(fechaSiguiente)}`}
                >
                  7 días →
                </Link>
              </div>
              <div className="agenda-matriz-scroll">
                <table className="agenda-matriz-tabla">
                  <thead>
                    <tr>
                      <th className="agenda-columna-hora" scope="col">Hora</th>
                      {fechasVisibles.map((fecha) => (
                        <th className={fecha === hoy ? 'agenda-dia agenda-dia--hoy' : 'agenda-dia'} scope="col" key={fecha}>
                          <span>{etiquetaDia(fecha)}</span>
                          {fecha === hoy && <span className="agenda-hoy">Hoy</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {horas.map((horaInicio) => {
                      const horaFin = `${String(Number(horaInicio.slice(0, 2)) + 1).padStart(2, '0')}:00`;
                      return (
                        <tr key={horaInicio}>
                          <th className="agenda-hora" scope="row">{formatearHora(horaInicio)}</th>
                          {fechasVisibles.map((fecha) => {
                            const ocupacion = reservasDeLaFranja(reservas, canchaId, fecha, horaInicio, horaFin);
                            const esPasada = fecha < hoy;
                            const seleccionada = seleccion?.fecha === fecha && seleccion.horaInicio === horaInicio;
                            return (
                              <td key={fecha}>
                                <button
                                  className={`agenda-celda ${ocupacion.length ? 'agenda-celda--ocupada' : 'agenda-celda--libre'}${seleccionada ? ' agenda-celda--seleccionada' : ''}`}
                                  type="button"
                                  disabled={esPasada || ocupacion.length > 0}
                                  aria-label={`${etiquetaDia(fecha)}, ${formatearHora(horaInicio)} a ${formatearHora(horaFin)}: ${esPasada ? 'fecha pasada' : ocupacion.length ? 'ocupada' : 'libre'}`}
                                  onClick={() => seleccionarFranja(fecha, horaInicio)}
                                >
                                  {esPasada ? (
                                    <span className="agenda-badge agenda-badge--pasada">Pasada</span>
                                  ) : ocupacion.length ? (
                                    <span className="agenda-badge agenda-badge--ocupada">Ocupada</span>
                                  ) : (
                                    <span className="agenda-badge agenda-badge--libre">Libre</span>
                                  )}
                                  {ocupacion[0] && <span className="agenda-reserva-mini">{ocupacion[0].clienteNombre}</span>}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {seleccion && canchaSeleccionada && (
              <aside className="agenda-reserva-panel rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="tu-reserva-titulo">
                <p className="seccion-kicker">Franja seleccionada</p>
                <h2 id="tu-reserva-titulo">Tu Reserva</h2>
                <dl className="agenda-reserva-datos">
                  <div><dt>Cancha</dt><dd>{canchaSeleccionada.nombre}</dd></div>
                  <div><dt>Fecha</dt><dd>{formatearFecha(seleccion.fecha)}</dd></div>
                  <div><dt>Horario</dt><dd>{formatearHora(seleccion.horaInicio)} – {formatearHora(seleccion.horaFin)}</dd></div>
                </dl>
                {clientes.length === 0 ? (
                  <div className="agenda-cliente-vacio">
                    <p>No hay clientes activos para asignar.</p>
                    <Link className="enlace-reserva" href="/reservas/clientes">Agregar cliente</Link>
                  </div>
                ) : (
                  <>
                    <div className="agenda-modo-cliente" role="group" aria-label="Tipo de cliente">
                      <button type="button" aria-pressed={modoCliente === 'existente'} disabled={clientes.length === 0} onClick={() => setModoCliente('existente')}>Cliente registrado</button>
                      <button type="button" aria-pressed={modoCliente === 'nuevo'} onClick={() => setModoCliente('nuevo')}>Nuevo cliente</button>
                    </div>
                    {modoCliente === 'existente' ? (
                      <Selector etiqueta="Cliente" value={clienteId} onChange={(evento) => setClienteId(evento.target.value)} required>
                        {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
                      </Selector>
                    ) : (
                      <div className="agenda-datos-cliente">
                        <Campo etiqueta="Nombre completo" autoComplete="name" value={nombreCliente} onChange={(evento) => setNombreCliente(evento.target.value)} required />
                        <Campo etiqueta="WhatsApp" type="tel" autoComplete="tel" value={whatsapp} onChange={(evento) => setWhatsapp(evento.target.value)} required />
                        <Campo etiqueta="Correo electrónico" type="email" autoComplete="email" value={correo} onChange={(evento) => setCorreo(evento.target.value)} required />
                      </div>
                    )}
                    <Selector etiqueta="Método de anticipo" value={metodoAnticipo} onChange={(evento) => setMetodoAnticipo(evento.target.value as MetodoAnticipo)} required>
                      <option value="transferencia">Transferencia</option>
                      <option value="efectivo">Pago en sede</option>
                    </Selector>
                    <div className="agenda-total">
                      <div>
                        <span>Total de la reserva · {duracionHoras || 1} h × {tarifaPorHora === null ? 'sin tarifa' : `${formatearPesos(tarifaPorHora)}/h`}</span>
                        <strong>{valorValido ? formatearPesos(valorNumerico) : 'Tarifa no configurada'}</strong>
                      </div>
                      <div className="agenda-anticipo">
                        <span>Anticipo requerido (25%)</span>
                        <strong>{valorValido ? formatearPesos(anticipoRequerido) : 'No disponible'}</strong>
                      </div>
                      <small>El anticipo queda pendiente; solo se registra como abonado cuando se recibe el pago.</small>
                    </div>
                    <div className="agenda-instrucciones-pago" role="status">
                      {metodoAnticipo === 'transferencia'
                        ? 'Después de confirmar, realiza la transferencia por el anticipo indicado y registra el abono en el detalle de la reserva. No se proporcionan datos bancarios en esta pantalla.'
                        : 'Realiza el anticipo en la sede. El pago se mantiene pendiente hasta que el personal lo registre en el detalle de la reserva.'}
                    </div>
                    <label className="agenda-privacidad">
                      <input type="checkbox" checked={politicasAceptadas} onChange={(evento) => setPoliticasAceptadas(evento.target.checked)} />
                      <span>Acepto el tratamiento de mis datos personales para gestionar esta reserva.</span>
                    </label>
                    <Boton type="button" className="agenda-confirmar" onClick={confirmarReserva} disabled={guardando || !valorValido || !politicasAceptadas || (modoCliente === 'existente' ? !clienteId : !(nombreCliente.trim() && whatsapp.trim() && correo.trim()))}>
                      {guardando ? 'Confirmando...' : 'Confirmar reserva'}
                    </Boton>
                  </>
                )}
                <Boton variante="secundario" type="button" className="agenda-cancelar-seleccion" onClick={() => setSeleccion(null)}>
                  Elegir otra franja
                </Boton>
              </aside>
            )}
          </div>
          {aviso && <Aviso tono={aviso.tipo} role="status">{aviso.texto}</Aviso>}
        </>
      )}
    </main>
  );
}