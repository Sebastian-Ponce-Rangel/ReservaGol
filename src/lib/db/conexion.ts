import { Pool, types, type PoolClient } from 'pg';

types.setTypeParser(1082, (valor) => valor);
types.setTypeParser(1083, (valor) => valor.slice(0, 5));
types.setTypeParser(1114, (valor) => valor);
types.setTypeParser(1184, (valor) => valor);
types.setTypeParser(20, (valor) => Number.parseInt(valor, 10));

function cadenaConexionAplicacion(): string {
  const cadena =
    process.env.NODE_ENV === 'production'
      ? process.env.RESERVAGOL_POSTGRES_URL
      : process.env.RESERVAGOL_POSTGRES_URL_NON_POOLING ??
        process.env.RESERVAGOL_POSTGRES_URL;
  if (!cadena) {
    throw new Error('Falta configurar la variable de conexión de ReservaGol.');
  }

  const url = new URL(cadena);
  for (const parametro of ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey']) {
    url.searchParams.delete(parametro);
  }

  return url.toString();
}

const globalParaPool = globalThis as typeof globalThis & {
  poolReservaGol?: Pool;
};

export const pool =
  globalParaPool.poolReservaGol ??
  new Pool({
    connectionString: cadenaConexionAplicacion(),
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalParaPool.poolReservaGol = pool;
}

export async function consultar<T>(
  sql: string,
  valores: unknown[] = [],
): Promise<T[]> {
  const resultado = await pool.query(sql, valores);
  return resultado.rows as T[];
}

export async function conTransaccion<T>(
  trabajo: (tx: PoolClient) => Promise<T>,
): Promise<T> {
  const tx = await pool.connect();

  try {
    await tx.query('BEGIN');
    const resultado = await trabajo(tx);
    await tx.query('COMMIT');
    return resultado;
  } catch (error) {
    await tx.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    tx.release();
  }
}