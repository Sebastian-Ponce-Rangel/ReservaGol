import pg from 'pg';

const { Client } = pg;

export function crearClientePostgres() {
  const connectionString =
    process.env.RESERVAGOL_POSTGRES_URL_NON_POOLING ??
    process.env.RESERVAGOL_POSTGRES_URL;

  if (!connectionString) {
    throw new Error('Falta RESERVAGOL_POSTGRES_URL o RESERVAGOL_POSTGRES_URL_NON_POOLING.');
  }

  const url = new URL(connectionString);
  for (const parametro of ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey']) {
    url.searchParams.delete(parametro);
  }

  return new Client({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
}