import { consultar } from '@/lib/db/conexion';
import { listarCanchas } from './canchas';
import { listarReservas } from './reservas';
import type { AgendaDia, ResumenCobros } from './tipos';

export async function agendaDelDia(fecha: string): Promise<AgendaDia> {
  const [canchas, reservas] = await Promise.all([
    listarCanchas(),
    listarReservas({ fecha, estado: 'activa' }),
  ]);

  return {
    fecha,
    canchas: canchas.map((cancha) => ({
      canchaId: cancha.id,
      canchaNombre: cancha.nombre,
      reservas: reservas.filter((reserva) => reserva.canchaId === cancha.id),
    })),
  };
}

type FilaResumen = {
  totalCobrado: number;
  totalReservas: number;
  pendiente: number;
  anticipo: number;
  pagado: number;
};

export async function resumenCobros(desde: string, hasta: string): Promise<ResumenCobros> {
  const filas = await consultar<FilaResumen>(
    `SELECT
       COALESCE(SUM(abonado), 0)::bigint AS "totalCobrado",
       COUNT(*)::int AS "totalReservas",
       COUNT(*) FILTER (WHERE abonado <= 0)::int AS pendiente,
       COUNT(*) FILTER (WHERE abonado > 0 AND abonado < valor_total)::int AS anticipo,
       COUNT(*) FILTER (WHERE abonado >= valor_total)::int AS pagado
     FROM v_reservas
     WHERE estado = 'activa' AND fecha BETWEEN $1 AND $2`,
    [desde, hasta],
  );
  const fila = filas[0];

  return {
    desde,
    hasta,
    totalCobrado: Number(fila?.totalCobrado ?? 0),
    totalReservas: Number(fila?.totalReservas ?? 0),
    porEstado: {
      pendiente: Number(fila?.pendiente ?? 0),
      anticipo: Number(fila?.anticipo ?? 0),
      pagado: Number(fila?.pagado ?? 0),
    },
  };
}