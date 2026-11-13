import Link from 'next/link';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Insignia } from '@/components/ui/Insignia';
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
          <h1 className="agenda-titulo">Panel de Control</h1>
        </div>
        <Link
          className="boton boton--primario"
          href={`/reservas/nueva?canchaId=${encodeURIComponent(canchaId)}&fecha=${encodeURIComponent(fecha)}`}
        >
          Nueva reserva
        </Link>
      </header>

      <form className="agenda-filtros rounded-xl border border-gray-700/50 bg-gray-900/50 p-5 shadow-lg backdrop-blur-md" action="/reservas" method="get">
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
          <section className="agenda-seccion rounded-xl border border-gray-700/50 bg-gray-900/50 p-5 shadow-lg backdrop-blur-md transition-shadow hover:shadow-green-500/10" aria-labelledby="ocupadas-titulo">
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
                    <li className="agenda-ocupada transition-colors hover:bg-gray-800" key={reserva.id}>
                      <div className="agenda-horas">
                        {formatearHora(reserva.horaInicio)}–{formatearHora(reserva.horaFin)}
                      </div>
                      <div className="agenda-detalle">
                        <Link className="agenda-detalle-enlace" href={`/reservas/${reserva.id}`}>
                          {reserva.clienteNombre}
                        </Link>
                        <span>{reserva.canchaNombre}</span>
                        <Insignia tono="rojo">Ocupada</Insignia>
                      </div>
                      <InsigniaEstadoPago estado={reserva.estadoPago} />
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section className="agenda-seccion rounded-xl border border-gray-700/50 bg-gray-900/50 p-5 shadow-lg backdrop-blur-md transition-shadow hover:shadow-green-500/10" aria-labelledby="libres-titulo">
            <div className="seccion-cabecera">
              <h2 id="libres-titulo">Franjas libres</h2>
              <span className="pagina-conteo">{libres.length}</span>
            </div>
            {libres.length === 0 ? (
              <EstadoVacio titulo="Día completo" />
            ) : (
              <ul className="franjas-libres">
                {libres.map((franja) => (
                  <li className="transition-colors hover:bg-gray-800" key={`${franja.horaInicio}-${franja.horaFin}`}>
                    <span>{formatearHora(franja.horaInicio)}–{formatearHora(franja.horaFin)}</span>
                    <Insignia tono="verde">Libre</Insignia>
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