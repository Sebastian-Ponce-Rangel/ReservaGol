import { consultar } from '@/lib/db/conexion';
import { listarCanchas } from './canchas';
import { listarReservas } from './reservas';
import { estadoPago, saldo } from '@/lib/reglas/pago';
import type {
  AgendaDia,
  ResumenAdministrador,
  ResumenCobros,
  ReservaResumenAdministrador,
} from './tipos';

export async function agendaDelDia(fecha: string): Promise<AgendaDia> {
  const [canchas, reservas] = await Promise.all([
    listarCanchas({ incluirInactivas: true }),
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
    WHERE fecha BETWEEN $1 AND $2`,
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

type FilaResumenAdministrador = {
  totalAlquileres: number;
  alquileresActivos: number;
  ingresos: number;
  canchasAlquiladas: number;
};

type FilaCanchaAdministracion = {
  canchaId: string;
  canchaNombre: string;
  alquileres: number;
  ingresos: number;
};

type FilaReservaAdministracion = {
  id: string;
  clienteNombre: string;
  clienteContacto: string;
  clienteEmail: string | null;
  canchaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  valorTotal: number;
  anticipoRequerido: boolean;
  abonado: number;
  estado: 'activa' | 'cancelada';
};

export async function resumenAdministrador(
  desde: string,
  hasta: string,
): Promise<ResumenAdministrador> {
  const [totales, canchas, reservas] = await Promise.all([
    consultar<FilaResumenAdministrador>(
      `SELECT
         COUNT(*)::int AS "totalAlquileres",
         COUNT(*) FILTER (WHERE estado = 'activa')::int AS "alquileresActivos",
         COALESCE(SUM(abonado), 0)::bigint AS ingresos,
         COUNT(DISTINCT cancha_id) FILTER (WHERE estado = 'activa')::int AS "canchasAlquiladas"
       FROM v_reservas
       WHERE fecha BETWEEN $1 AND $2`,
      [desde, hasta],
    ),
    consultar<FilaCanchaAdministracion>(
      `SELECT c.id AS "canchaId", c.nombre AS "canchaNombre",
              COUNT(r.id) FILTER (WHERE r.estado = 'activa')::int AS alquileres,
              COALESCE(SUM(r.abonado), 0)::bigint AS ingresos
       FROM canchas c
       LEFT JOIN v_reservas r ON r.cancha_id = c.id AND r.fecha BETWEEN $1 AND $2
       WHERE c.activa = true
       GROUP BY c.id, c.nombre
       ORDER BY alquileres DESC, lower(c.nombre), c.id`,
      [desde, hasta],
    ),
    consultar<FilaReservaAdministracion>(
      `SELECT r.id,
              r.cliente_nombre AS "clienteNombre",
              c.contacto AS "clienteContacto",
              c.email AS "clienteEmail",
              r.cancha_nombre AS "canchaNombre",
              r.fecha::text AS fecha,
              r.hora_inicio AS "horaInicio",
              r.hora_fin AS "horaFin",
              r.valor_total AS "valorTotal",
              (r.metodo_anticipo IS NOT NULL) AS "anticipoRequerido",
              r.abonado,
              r.estado
       FROM v_reservas r
       JOIN clientes c ON c.id = r.cliente_id
       ORDER BY r.created_at DESC, r.id DESC`,
      [],
    ),
  ]);
  const fila = totales[0];

  return {
    desde,
    hasta,
    totalAlquileres: Number(fila?.totalAlquileres ?? 0),
    alquileresActivos: Number(fila?.alquileresActivos ?? 0),
    ingresos: Number(fila?.ingresos ?? 0),
    canchasAlquiladas: Number(fila?.canchasAlquiladas ?? 0),
    reservas: reservas.map((reserva): ReservaResumenAdministrador => {
      const valorTotal = Number(reserva.valorTotal);
      const abonado = Number(reserva.abonado);
      return {
        ...reserva,
        valorTotal,
        anticipoRequerido: reserva.anticipoRequerido ? Math.ceil(valorTotal * 0.25) : null,
        abonado,
        saldo: saldo(valorTotal, abonado),
        estadoPago: estadoPago(valorTotal, abonado),
      };
    }),
    porCancha: canchas.map((cancha) => ({
      ...cancha,
      alquileres: Number(cancha.alquileres),
      ingresos: Number(cancha.ingresos),
    })),
  };
}