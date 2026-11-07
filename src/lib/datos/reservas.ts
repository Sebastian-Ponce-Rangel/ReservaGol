import type { PoolClient } from 'pg';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import { LIMITE_LISTADO } from '@/lib/config/reservagol';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota } from '@/lib/reglas/fechas';
import { haySolape } from '@/lib/reglas/horario';
import { abonoValido, estadoPago, saldo } from '@/lib/reglas/pago';
import { validarReserva } from '@/lib/reglas/reserva';
import { esquemaFiltrosReservas } from '@/lib/validacion/esquemas';
import { exigirCanchaActiva } from './canchas';
import { exigirClienteActivo } from './clientes';
import type {
  Abono,
  Cobro,
  DatosReserva,
  FiltrosReservas,
  Franja,
  Reserva,
  ReservaConCobro,
} from './tipos';

type FilaReservaVista = {
  id: string;
  canchaId: string;
  canchaNombre: string;
  clienteId: string;
  clienteNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  valorTotal: number;
  estado: 'activa' | 'cancelada';
  abonado: number;
};

type FilaAbono = {
  id: number;
  reservaId: string;
  monto: number;
  fecha: string;
  createdAt: string;
};

type FilaReservaBloqueada = {
  estado: 'activa' | 'cancelada';
  valorTotal: number;
};

const SQL_RESERVA_VISTA = `
  SELECT
    id,
    cancha_id AS "canchaId",
    cancha_nombre AS "canchaNombre",
    cliente_id AS "clienteId",
    cliente_nombre AS "clienteNombre",
    fecha::text AS fecha,
    hora_inicio AS "horaInicio",
    hora_fin AS "horaFin",
    valor_total AS "valorTotal",
    estado,
    abonado
  FROM v_reservas
`;

function mapearAbono(fila: FilaAbono): Abono {
  return {
    ...fila,
    id: Number(fila.id),
    monto: Number(fila.monto),
  };
}

function mapearReserva(fila: FilaReservaVista): Reserva {
  const valorTotal = Number(fila.valorTotal);
  const abonado = Number(fila.abonado);

  return {
    ...fila,
    valorTotal,
    abonado,
    estadoPago: estadoPago(valorTotal, abonado),
    saldo: saldo(valorTotal, abonado),
  };
}

async function buscarFilaEnTransaccion(
  tx: PoolClient,
  id: string,
): Promise<FilaReservaVista> {
  const resultado = await tx.query<FilaReservaVista>(
    `${SQL_RESERVA_VISTA} WHERE id = $1`,
    [id],
  );
  const fila = resultado.rows[0];
  if (!fila) throw new ErrorDeNegocio('RESERVA_NO_ENCONTRADA');
  return fila;
}

async function listarAbonosEnTransaccion(
  tx: PoolClient,
  reservaId: string,
): Promise<Abono[]> {
  const resultado = await tx.query<FilaAbono>(
    `SELECT id, reserva_id AS "reservaId", monto, fecha::text AS fecha,
            created_at::text AS "createdAt"
     FROM abonos
     WHERE reserva_id = $1
     ORDER BY fecha, created_at, id`,
    [reservaId],
  );
  return resultado.rows.map(mapearAbono);
}

async function obtenerCobroEnTransaccion(
  tx: PoolClient,
  reservaId: string,
): Promise<ReservaConCobro> {
  const fila = await buscarFilaEnTransaccion(tx, reservaId);
  const reserva = mapearReserva(fila);
  const abonos = await listarAbonosEnTransaccion(tx, reservaId);
  const { abonado, estadoPago: estadoDelPago, saldo: saldoPendiente, ...datosReserva } = reserva;
  const cobro: Cobro = {
    total: reserva.valorTotal,
    abonado,
    saldo: saldoPendiente,
    estadoPago: estadoDelPago,
    abonos,
  };

  return { ...datosReserva, cobro };
}

function mapearErrorDeReserva(error: unknown): never {
  const errorPostgres = error as { code?: string; constraint?: string };
  if (
    errorPostgres.code === '23505' &&
    errorPostgres.constraint === 'ux_reservas_slot_activo'
  ) {
    throw new ErrorDeNegocio('CHOQUE_HORARIO');
  }
  throw error;
}

export async function crearReserva(datos: DatosReserva): Promise<Reserva> {
  try {
    return await conTransaccion(async (tx) => {
      validarReserva(datos, hoyBogota());
      await exigirCanchaActiva(tx, datos.canchaId);
      await exigirClienteActivo(tx, datos.clienteId);

      const activas = await tx.query<Franja>(
        `SELECT hora_inicio AS "horaInicio", hora_fin AS "horaFin"
         FROM reservas
         WHERE cancha_id = $1 AND fecha = $2 AND estado = 'activa'
         FOR UPDATE`,
        [datos.canchaId, datos.fecha],
      );

      for (const franja of activas.rows) {
        if (haySolape(datos.horaInicio, datos.horaFin, franja.horaInicio, franja.horaFin)) {
          throw new ErrorDeNegocio('CHOQUE_HORARIO', undefined, {
            conflicto: {
              horaInicio: franja.horaInicio,
              horaFin: franja.horaFin,
            },
          });
        }
      }

      const insertada = await tx.query<{ id: string }>(
        `INSERT INTO reservas
          (cancha_id, cliente_id, fecha, hora_inicio, hora_fin, valor_total, estado)
         VALUES ($1, $2, $3, $4, $5, $6, 'activa')
         RETURNING id`,
        [
          datos.canchaId,
          datos.clienteId,
          datos.fecha,
          datos.horaInicio,
          datos.horaFin,
          datos.valorTotal,
        ],
      );
      const fila = insertada.rows[0];
      if (!fila) throw new ErrorDeNegocio('ERROR_INTERNO');
      return mapearReserva(await buscarFilaEnTransaccion(tx, fila.id));
    });
  } catch (error) {
    return mapearErrorDeReserva(error);
  }
}

export async function disponibilidad(
  canchaId: string,
  fecha: string,
): Promise<{ ocupadas: Franja[] }> {
  const canchas = await consultar<{ id: string }>(
    'SELECT id FROM canchas WHERE id = $1 AND activa = true',
    [canchaId],
  );
  if (canchas.length === 0) throw new ErrorDeNegocio('CANCHA_NO_ENCONTRADA');

  const ocupadas = await consultar<Franja>(
    `SELECT hora_inicio AS "horaInicio", hora_fin AS "horaFin"
     FROM reservas
     WHERE cancha_id = $1 AND fecha = $2 AND estado = 'activa'
     ORDER BY hora_inicio`,
    [canchaId, fecha],
  );
  return { ocupadas };
}

export async function obtenerReserva(id: string): Promise<ReservaConCobro> {
  const filas = await consultar<FilaReservaVista>(
    `${SQL_RESERVA_VISTA} WHERE id = $1`,
    [id],
  );
  const fila = filas[0];
  if (!fila) throw new ErrorDeNegocio('RESERVA_NO_ENCONTRADA');

  const reserva = mapearReserva(fila);
  const abonos = await consultar<FilaAbono>(
    `SELECT id, reserva_id AS "reservaId", monto, fecha::text AS fecha,
            created_at::text AS "createdAt"
     FROM abonos
     WHERE reserva_id = $1
     ORDER BY fecha, created_at, id`,
    [id],
  );
  const { abonado, estadoPago: estadoDelPago, saldo: saldoPendiente, ...datosReserva } = reserva;

  return {
    ...datosReserva,
    cobro: {
      total: reserva.valorTotal,
      abonado,
      saldo: saldoPendiente,
      estadoPago: estadoDelPago,
      abonos: abonos.map(mapearAbono),
    },
  };
}

export async function cancelarReserva(id: string): Promise<Reserva> {
  return conTransaccion(async (tx) => {
    const actual = await tx.query<{ estado: 'activa' | 'cancelada' }>(
      'SELECT estado FROM reservas WHERE id = $1 FOR UPDATE',
      [id],
    );
    const reserva = actual.rows[0];
    if (!reserva) throw new ErrorDeNegocio('RESERVA_NO_ENCONTRADA');
    if (reserva.estado === 'cancelada') throw new ErrorDeNegocio('RESERVA_CANCELADA');

    await tx.query("UPDATE reservas SET estado = 'cancelada' WHERE id = $1", [id]);
    return mapearReserva(await buscarFilaEnTransaccion(tx, id));
  });
}

export async function registrarAbono(id: string, monto: number): Promise<Cobro> {
  return conTransaccion(async (tx) => {
    const resultado = await tx.query<FilaReservaBloqueada>(
      `SELECT estado, valor_total AS "valorTotal"
       FROM reservas
       WHERE id = $1
       FOR UPDATE`,
      [id],
    );
    const reserva = resultado.rows[0];
    if (!reserva) throw new ErrorDeNegocio('RESERVA_NO_ENCONTRADA');
    if (reserva.estado === 'cancelada') throw new ErrorDeNegocio('RESERVA_CANCELADA');
    if (!Number.isInteger(monto) || monto <= 0) {
      throw new ErrorDeNegocio('DATOS_INVALIDOS');
    }

    const suma = await tx.query<{ abonado: number }>(
      'SELECT COALESCE(SUM(monto), 0)::bigint AS abonado FROM abonos WHERE reserva_id = $1',
      [id],
    );
    const abonadoActual = Number(suma.rows[0]?.abonado ?? 0);
    const total = Number(reserva.valorTotal);
    if (!abonoValido(total, abonadoActual, monto)) {
      throw new ErrorDeNegocio('ABONO_EXCEDE_TOTAL');
    }

    await tx.query(
      'INSERT INTO abonos (reserva_id, monto, fecha) VALUES ($1, $2, $3)',
      [id, monto, hoyBogota()],
    );

    const cobro = await obtenerCobroEnTransaccion(tx, id);
    return cobro.cobro;
  });
}

export async function listarReservas(
  filtros: FiltrosReservas = {},
): Promise<Reserva[]> {
  const filtrosValidados = esquemaFiltrosReservas.parse(filtros);
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (filtrosValidados.canchaId) {
    valores.push(filtrosValidados.canchaId);
    condiciones.push(`cancha_id = $${valores.length}`);
  }
  if (filtrosValidados.fecha) {
    valores.push(filtrosValidados.fecha);
    condiciones.push(`fecha = $${valores.length}`);
  }
  if (filtrosValidados.estado) {
    valores.push(filtrosValidados.estado);
    condiciones.push(`estado = $${valores.length}`);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  valores.push(LIMITE_LISTADO);
  const filas = await consultar<FilaReservaVista>(
    `${SQL_RESERVA_VISTA} ${where}
     ORDER BY fecha DESC, hora_inicio DESC
     LIMIT $${valores.length}`,
    valores,
  );

  return filas.map(mapearReserva);
}