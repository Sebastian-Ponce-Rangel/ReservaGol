import { AgendaCliente } from '@/components/reservagol/AgendaCliente';
import { listarBloquesOcupadosPublicos, listarCanchas } from '@/lib/dataService';
import { esFechaValida, hoyBogota } from '@/lib/reglas/fechas';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ canchaId?: string; fecha?: string }>;
};

function diasSiguientes(fechaInicial: string): string[] {
  const inicio = new Date(`${fechaInicial}T00:00:00.000Z`);
  return Array.from({ length: 7 }, (_, indice) => {
    const fecha = new Date(inicio);
    fecha.setUTCDate(inicio.getUTCDate() + indice);
    return fecha.toISOString().slice(0, 10);
  });
}

export default async function ReservasPage({ searchParams }: Props) {
  const parametros = await searchParams;
  const hoy = hoyBogota();
  const fechaReferencia = parametros.fecha && esFechaValida(parametros.fecha) && parametros.fecha >= hoy
    ? parametros.fecha
    : hoy;
  const fechas = diasSiguientes(fechaReferencia);
  const [canchas, ocupadas] = await Promise.all([
    listarCanchas(),
    listarBloquesOcupadosPublicos(fechas[0] ?? hoy, fechas[fechas.length - 1] ?? hoy),
  ]);
  const canchaInicial = canchas.some((cancha) => cancha.id === parametros.canchaId)
    ? parametros.canchaId ?? ''
    : canchas[0]?.id ?? '';

  return <AgendaCliente
      canchas={canchas}
      canchaInicial={canchaInicial}
      hoy={hoy}
      fechas={fechas}
      ocupadas={ocupadas}
    />;
}
