import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const connectionString = process.env.RESERVAGOL_POSTGRES_URL;

if (!connectionString) {
  console.error('Falta la variable RESERVAGOL_POSTGRES_URL.');
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsPath = join(root, 'supabase', 'migrations');
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

try {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrations = (await readdir(migrationsPath))
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  if (migrations.length === 0) {
    throw new Error('No hay archivos SQL en supabase/migrations.');
  }

  for (const name of migrations) {
    await client.query('BEGIN');
    try {
      const applied = await client.query(
        'SELECT 1 FROM _migrations WHERE name = $1',
        [name],
      );

      if (applied.rowCount) {
        await client.query('ROLLBACK');
        console.log(`omitida ${name}`);
        continue;
      }

      const sql = await readFile(join(migrationsPath, name), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`aplicada ${name}`);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    }
  }
} catch (error) {
  const mensaje = String(error.message ?? '').toLowerCase();
  const detalle =
    error.code ??
    error.cause?.code ??
    (mensaje.includes('timeout') ? 'timeout' : 'error sin código');
  console.error(
    'Falló db:migrar:',
    detalle,
  );
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}