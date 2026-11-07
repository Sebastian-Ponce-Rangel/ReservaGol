import { AgendaDia } from '@/components/reservagol/AgendaDia';
import { listarCanchas, listarReservas, disponibilidad } from '@/lib/dataService';
import { hoyBogota, esFechaValida } from '@/lib/reglas/fechas';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ canchaId?: string; fecha?: string }>;
};

export default async function ReservasPage({ searchParams }: Props) {
  const parametros = await searchParams;
  const canchas = await listarCanchas();
  const canchaSeleccionada = canchas.some((cancha) => cancha.id === parametros.canchaId)
    ? parametros.canchaId ?? ''
    : canchas[0]?.id ?? '';
  const hoy = hoyBogota();
  const fecha = parametros.fecha && esFechaValida(parametros.fecha) ? parametros.fecha : hoy;

  if (!canchaSeleccionada) {
    return <AgendaDia canchas={canchas} canchaId="" fecha={fecha} reservas={[]} ocupadas={[]} />;
  }

  const [reservas, disponibilidadDelDia] = await Promise.all([
    listarReservas({ canchaId: canchaSeleccionada, fecha, estado: 'activa' }),
    disponibilidad(canchaSeleccionada, fecha),
  ]);

  return (
    <AgendaDia
      canchas={canchas}
      canchaId={canchaSeleccionada}
      fecha={fecha}
      reservas={reservas}
      ocupadas={disponibilidadDelDia.ocupadas}
    />
  );
}
