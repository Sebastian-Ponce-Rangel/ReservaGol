import Link from 'next/link';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { agendaDelDia, resumenCobros } from '@/lib/dataService';
import { formatearFecha, formatearHora, formatearPesos } from '@/lib/formato';
import { HORA_APERTURA, HORA_CIERRE } from '@/lib/config/reservagol';
import type { Reserva } from '@/lib/datos/tipos';
import { esFechaValida, hoyBogota } from '@/lib/reglas/fechas';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ fecha?: string | string[]; desde?: string | string[]; hasta?: string | string[] }>;
};

function valorUnico(valor: string | string[] | undefined): string | undefined {
  return typeof valor === 'string' ? valor : undefined;
}

function rangoDelMes(fecha: string): { desde: string; hasta: string } {
  const [anio, mes] = fecha.split('-');
  const ultimoDia = new Date(Date.UTC(Number(anio), Number(mes), 0)).getUTCDate();
  return {
    desde: `${anio}-${mes}-01`,
    hasta: `${anio}-${mes}-${String(ultimoDia).padStart(2, '0')}`,
  };
}

function horasDelDia(): string[] {
  const inicio = Number(HORA_APERTURA.slice(0, 2));
  const fin = Number(HORA_CIERRE.slice(0, 2));
  return Array.from({ length: fin - inicio }, (_, indice) =>
    `${String(inicio + indice).padStart(2, '0')}:00`,
  );
}

function reservasDeLaHora(reservas: Reserva[], hora: string): Reserva[] {
  const horaSiguiente = `${String(Number(hora.slice(0, 2)) + 1).padStart(2, '0')}:00`;
  return reservas.filter((reserva) => reserva.horaInicio < horaSiguiente && hora < reserva.horaFin);
}

export default async function ResumenPage({ searchParams }: Props) {
  const parametros = await searchParams;
  const hoy = hoyBogota();
  const rangoPredeterminado = rangoDelMes(hoy);
  const fechaSolicitada = valorUnico(parametros.fecha);
  const desdeSolicitado = valorUnico(parametros.desde);
  const hastaSolicitado = valorUnico(parametros.hasta);
  const fecha = fechaSolicitada && esFechaValida(fechaSolicitada) ? fechaSolicitada : hoy;
  const rangoValido = Boolean(
    desdeSolicitado && hastaSolicitado && esFechaValida(desdeSolicitado) &&
    esFechaValida(hastaSolicitado) && desdeSolicitado <= hastaSolicitado,
  );
  const desde = rangoValido ? desdeSolicitado! : rangoPredeterminado.desde;
  const hasta = rangoValido ? hastaSolicitado! : rangoPredeterminado.hasta;
  const [agenda, cobros] = await Promise.all([
    agendaDelDia(fecha),
    resumenCobros(desde, hasta),
  ]);
  const horas = horasDelDia();

  return (
    <main className="app-contenido">
      <header className="pagina-cabecera">
        <div>
          <p className="seccion-kicker">Operación y caja</p>
          <h1>Resumen</h1>
        </div>
        <Link className="boton boton--primario" href={`/reservas/nueva?fecha=${encodeURIComponent(fecha)}`}>
          Nueva reserva
        </Link>
      </header>

      <form className="resumen-filtros rounded-xl border border-slate-200 bg-white p-5 shadow-sm" action="/reservas/resumen" method="get">
        <Campo etiqueta="Día de agenda" name="fecha" type="date" defaultValue={fecha} required />
        <Campo etiqueta="Cobros desde" name="desde" type="date" defaultValue={desde} required />
        <Campo etiqueta="Cobros hasta" name="hasta" type="date" defaultValue={hasta} required />
        <Boton variante="secundario" type="submit">Consultar</Boton>
      </form>

      <section className="resumen-seccion rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="agenda-global-titulo">
        <div className="seccion-cabecera">
          <h2 id="agenda-global-titulo">Agenda de todas las canchas</h2>
          <span className="pagina-conteo">{formatearFecha(fecha)}</span>
        </div>
        {agenda.canchas.length === 0 ? (
          <EstadoVacio titulo="No hay canchas registradas" />
        ) : (
          <div className="tabla-contenedor agenda-global-contenedor">
            <table className="tabla-agenda-global">
              <caption>Franjas horarias del {formatearFecha(fecha)}</caption>
              <thead className="bg-slate-100">
                <tr>
                  <th className="rounded-tl-lg" scope="col">Cancha</th>
                  {horas.map((hora) => <th className="last:rounded-tr-lg" scope="col" key={hora}>{formatearHora(hora)}</th>)}
                </tr>
              </thead>
              <tbody>
                {agenda.canchas.map((cancha) => (
                  <tr className="transition-colors hover:bg-slate-50" key={cancha.canchaId}>
                    <th scope="row">{cancha.canchaNombre}</th>
                    {horas.map((hora) => {
                      const reservas = reservasDeLaHora(cancha.reservas, hora);
                      return (
                        <td
                          className={reservas.length ? 'agenda-celda agenda-celda--ocupada' : 'agenda-celda agenda-celda--libre'}
                          key={hora}
                        >
                          {reservas.length === 0 ? (
                            <span>Libre</span>
                          ) : (
                            <>
                              <span>Ocupado</span>
                              {reservas.map((reserva) => (
                                <Link key={reserva.id} href={`/reservas/${reserva.id}`}>
                                  {reserva.clienteNombre} · {formatearHora(reserva.horaInicio)}–{formatearHora(reserva.horaFin)}
                                </Link>
                              ))}
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="resumen-seccion rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="cobros-titulo">
        <div className="seccion-cabecera">
          <h2 id="cobros-titulo">Resumen de cobros</h2>
          <span className="pagina-conteo">{formatearFecha(desde)} – {formatearFecha(hasta)}</span>
        </div>
        <dl className="resumen-cifras">
          <div>
            <dt>Total cobrado</dt>
            <dd>{formatearPesos(cobros.totalCobrado)}</dd>
          </div>
          <div>
            <dt>Reservas del periodo</dt>
            <dd>{cobros.totalReservas}</dd>
          </div>
        </dl>
        <div className="tabla-contenedor">
          <table className="tabla-reservas">
            <thead className="bg-slate-100">
              <tr><th className="rounded-tl-lg">Estado de pago</th><th className="rounded-tr-lg">Reservas</th></tr>
            </thead>
            <tbody>
              <tr className="transition-colors hover:bg-slate-50"><td>Pendiente</td><td>{cobros.porEstado.pendiente}</td></tr>
              <tr className="transition-colors hover:bg-slate-50"><td>Anticipo</td><td>{cobros.porEstado.anticipo}</td></tr>
              <tr className="transition-colors hover:bg-slate-50"><td>Pagado</td><td>{cobros.porEstado.pagado}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}