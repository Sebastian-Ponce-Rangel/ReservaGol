import Link from 'next/link';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { FormularioReserva } from '@/components/reservagol/FormularioReserva';
import { listarCanchas, listarClientes } from '@/lib/dataService';
import { esFechaValida, hoyBogota } from '@/lib/reglas/fechas';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ canchaId?: string; fecha?: string }>;
};

export default async function NuevaReservaPage({ searchParams }: Props) {
  const parametros = await searchParams;
  const [canchas, clientes] = await Promise.all([listarCanchas(), listarClientes()]);
  const hoy = hoyBogota();
  const fechaInicial = parametros.fecha && esFechaValida(parametros.fecha) ? parametros.fecha : hoy;
  const canchaInicial = canchas.some((cancha) => cancha.id === parametros.canchaId)
    ? parametros.canchaId ?? ''
    : canchas[0]?.id ?? '';

  return (
    <main className="app-contenido">
      <header className="pagina-cabecera">
        <div>
          <p className="seccion-kicker">Nueva</p>
          <h1>Reserva</h1>
        </div>
      </header>
      {canchas.length === 0 ? (
        <div className="estado-con-enlace">
          <EstadoVacio titulo="No hay canchas activas" detalle="Agrega una cancha antes de crear una reserva." />
          <Link className="boton boton--primario" href="/reservas/canchas">Ir a Canchas</Link>
        </div>
      ) : clientes.length === 0 ? (
        <div className="estado-con-enlace">
          <EstadoVacio titulo="No hay clientes activos" detalle="Agrega un cliente antes de crear una reserva." />
          <Link className="boton boton--primario" href="/reservas/clientes">Ir a Clientes</Link>
        </div>
      ) : (
        <FormularioReserva
          canchas={canchas}
          clientes={clientes}
          canchaInicial={canchaInicial}
          fechaInicial={fechaInicial}
          hoy={hoy}
        />
      )}
    </main>
  );
}