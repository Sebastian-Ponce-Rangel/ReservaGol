import { conTransaccion } from '@/lib/db/conexion';

export type ConteosLimpieza = {
  abonos: number;
  reservas: number;
  clientes: number;
  canchas: number;
};

async function limpiarPorPrefijos(prefijos: string[]): Promise<ConteosLimpieza> {
  return conTransaccion(async (tx) => {
    const abonos = await tx.query(
      `DELETE FROM abonos
       WHERE reserva_id IN (
         SELECT r.id
         FROM reservas r
         JOIN canchas c ON c.id = r.cancha_id
         JOIN clientes cl ON cl.id = r.cliente_id
         WHERE c.nombre ILIKE ANY($1::text[]) OR cl.nombre ILIKE ANY($1::text[])
       )`,
      [prefijos],
    );
    const reservas = await tx.query(
      `DELETE FROM reservas r
       USING canchas c, clientes cl
       WHERE r.cancha_id = c.id AND r.cliente_id = cl.id
         AND (c.nombre ILIKE ANY($1::text[]) OR cl.nombre ILIKE ANY($1::text[]))`,
      [prefijos],
    );
    const clientes = await tx.query(
      'DELETE FROM clientes WHERE nombre ILIKE ANY($1::text[])',
      [prefijos],
    );
    const canchas = await tx.query(
      'DELETE FROM canchas WHERE nombre ILIKE ANY($1::text[])',
      [prefijos],
    );

    return {
      abonos: abonos.rowCount ?? 0,
      reservas: reservas.rowCount ?? 0,
      clientes: clientes.rowCount ?? 0,
      canchas: canchas.rowCount ?? 0,
    };
  });
}

export function limpiarDatosPrueba(): Promise<ConteosLimpieza> {
  return limpiarPorPrefijos(['Prueba%']);
}

export function limpiarDatosDemo(): Promise<ConteosLimpieza> {
  return limpiarPorPrefijos(['Demo%']);
}

export function limpiarDatosPruebaYDemo(): Promise<ConteosLimpieza> {
  return limpiarPorPrefijos(['Prueba%', 'Demo%']);
}