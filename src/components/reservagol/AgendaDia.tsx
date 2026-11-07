import Link from 'next/link';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Selector } from '@/components/ui/Selector';
import { InsigniaEstadoPago } from '@/components/reservagol/InsigniaEstadoPago';
import { formatearHora } from '@/lib/formato';
import { HORA_APERTURA, HORA_CIERRE } from '@/lib/config/reservagol';
import type { Cancha, Franja, Reserva } from '@/lib/datos/tipos';

type AgendaDiaProps = {
  canchas: Cancha[];
  canchaId: string;
  fecha: string;
  reservas: Reserva[];
  ocupadas: Franja[];
};

function franjasLibres(ocupadas: Franja[]): Franja[] {
  const ordenadas = [...ocupadas].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  const libres: Franja[] = [];
  let cursor = HORA_APERTURA;

  for (const franja of ordenadas) {
    if (franja.horaInicio > cursor) {
      libres.push({ horaInicio: cursor, horaFin: franja.horaInicio });
    }
    if (franja.horaFin > cursor) cursor = franja.horaFin;
  }

  if (cursor < HORA_CIERRE) {
    libres.push({ horaInicio: cursor, horaFin: HORA_CIERRE });
  }
  return libres;
}

export function AgendaDia({ canchas, canchaId, fecha, reservas, ocupadas }: AgendaDiaProps) {
  const libres = franjasLibres(ocupadas);

  return (
    <main className="app-contenido">
      <header className="pagina-cabecera">
        <div>
          <p className="seccion-kicker">Operación diaria</p>
          <h1>Agenda</h1>
        </div>
        <Link
          className="boton boton--primario"
          href={`/reservas/nueva?canchaId=${encodeURIComponent(canchaId)}&fecha=${encodeURIComponent(fecha)}`}
        >
          Nueva reserva
        </Link>
      </header>

      <form className="agenda-filtros" action="/reservas" method="get">
        <Selector etiqueta="Cancha" name="canchaId" defaultValue={canchaId} required disabled={canchas.length === 0}>
          {canchas.map((cancha) => (
            <option key={cancha.id} value={cancha.id}>{cancha.nombre}</option>
          ))}
        </Selector>
        <Campo etiqueta="Fecha" name="fecha" type="date" defaultValue={fecha} required />
        <Boton variante="secundario" type="submit">Consultar</Boton>
      </form>

      {canchas.length === 0 ? (
        <EstadoVacio titulo="No hay canchas activas" detalle="Agrega una cancha para consultar disponibilidad." />
      ) : (
        <div className="agenda-columnas">
          <section className="agenda-seccion" aria-labelledby="ocupadas-titulo">
            <div className="seccion-cabecera">
              <h2 id="ocupadas-titulo">Ocupadas</h2>
              <span className="pagina-conteo">{reservas.length}</span>
            </div>
            {reservas.length === 0 ? (
              <EstadoVacio titulo="Sin reservas" />
            ) : (
              <ul className="agenda-lista">
                {reservas
                  .slice()
                  .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                  .map((reserva) => (
                    <li className="agenda-ocupada" key={reserva.id}>
                      <div className="agenda-horas">
                        {formatearHora(reserva.horaInicio)}–{formatearHora(reserva.horaFin)}
                      </div>
                      <div className="agenda-detalle">
                        <strong>{reserva.clienteNombre}</strong>
                        <span>{reserva.canchaNombre}</span>
                      </div>
                      <InsigniaEstadoPago estado={reserva.estadoPago} />
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section className="agenda-seccion" aria-labelledby="libres-titulo">
            <div className="seccion-cabecera">
              <h2 id="libres-titulo">Franjas libres</h2>
              <span className="pagina-conteo">{libres.length}</span>
            </div>
            {libres.length === 0 ? (
              <EstadoVacio titulo="Día completo" />
            ) : (
              <ul className="franjas-libres">
                {libres.map((franja) => (
                  <li key={`${franja.horaInicio}-${franja.horaFin}`}>
                    <span>{formatearHora(franja.horaInicio)}–{formatearHora(franja.horaFin)}</span>
                    <span>Libre</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}