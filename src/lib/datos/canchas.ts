import type { PoolClient } from 'pg';
import { consultar } from '@/lib/db/conexion';
import { LIMITE_LISTADO } from '@/lib/config/reservagol';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esquemaCancha } from '@/lib/validacion/esquemas';
import type { Cancha, DatosCancha } from './tipos';

type FilaCancha = {
  id: string;
  nombre: string;
  precioHora: number | null;
  activa: boolean;
};

export async function listarCanchas(
  filtros: { incluirInactivas?: boolean } = {},
): Promise<Cancha[]> {
  return consultar<FilaCancha>(
    `SELECT id, nombre, precio_hora AS "precioHora", activa
     FROM canchas
     WHERE ($1::boolean OR activa = true)
     ORDER BY lower(nombre), id
     LIMIT $2`,
    [filtros.incluirInactivas ?? false, LIMITE_LISTADO],
  );
}

export async function crearCancha(datos: DatosCancha): Promise<{ id: string }> {
  const cancha = esquemaCancha.parse(datos);

  try {
    const filas = await consultar<{ id: string }>(
      `INSERT INTO canchas (nombre, precio_hora)
       VALUES ($1, $2)
       RETURNING id`,
      [cancha.nombre, cancha.precioHora ?? null],
    );
    const creada = filas[0];
    if (!creada) throw new ErrorDeNegocio('ERROR_INTERNO');
    return creada;
  } catch (error) {
    const errorPostgres = error as { code?: string; constraint?: string };
    if (
      errorPostgres.code === '23505' &&
      errorPostgres.constraint === 'ux_canchas_nombre'
    ) {
      throw new ErrorDeNegocio('CANCHA_DUPLICADA');
    }
    throw error;
  }
}

export async function desactivarCancha(id: string): Promise<void> {
  const filas = await consultar<{ id: string }>(
    'UPDATE canchas SET activa = false WHERE id = $1 RETURNING id',
    [id],
  );
  if (filas.length === 0) throw new ErrorDeNegocio('CANCHA_NO_ENCONTRADA');
}

export async function exigirCanchaActiva(tx: PoolClient, id: string): Promise<void> {
  const resultado = await tx.query<{ id: string }>(
    'SELECT id FROM canchas WHERE id = $1 AND activa = true FOR UPDATE',
    [id],
  );
  if (resultado.rowCount === 0) throw new ErrorDeNegocio('CANCHA_NO_ENCONTRADA');
}