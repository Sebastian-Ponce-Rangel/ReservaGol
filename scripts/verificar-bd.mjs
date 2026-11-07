import pg from 'pg';

const { Client } = pg;
const connectionString = process.env.RESERVAGOL_POSTGRES_URL;

if (!connectionString) {
  console.error('Falta la variable RESERVAGOL_POSTGRES_URL.');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

let fallas = 0;

function resultado(ok, mensaje) {
  console.log(`${ok ? 'OK' : 'FALLA'} ${mensaje}`);
  if (!ok) fallas += 1;
}

async function esperarError(nombre, codigo, restriccion, accion) {
  const savepoint = `sp_${nombre}`;
  await client.query(`SAVEPOINT ${savepoint}`);
  let error;

  try {
    await accion();
  } catch (capturado) {
    error = capturado;
  }

  await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
  await client.query(`RELEASE SAVEPOINT ${savepoint}`);

  const coincide =
    error?.code === codigo &&
    (restriccion === undefined || error.constraint === restriccion);
  resultado(
    coincide,
    `${nombre}: esperado ${codigo}${restriccion ? ` (${restriccion})` : ''}`,
  );
}

async function verificarEsquema() {
  const objetos = await client.query(`
    SELECT
      to_regclass('public.canchas') IS NOT NULL AS canchas,
      to_regclass('public.clientes') IS NOT NULL AS clientes,
      to_regclass('public.reservas') IS NOT NULL AS reservas,
      to_regclass('public.abonos') IS NOT NULL AS abonos,
      to_regclass('public.v_reservas') IS NOT NULL AS vista
  `);
  const existentes = objetos.rows[0];

  for (const nombre of ['canchas', 'clientes', 'reservas', 'abonos', 'vista']) {
    resultado(existentes[nombre], `objeto ${nombre} existe`);
  }

  if (Object.values(existentes).some((existe) => !existe)) return false;

  for (const tabla of ['canchas', 'clientes', 'reservas', 'abonos']) {
    const conteo = await client.query(`SELECT count(*)::int AS total FROM ${tabla}`);
    console.log(`Filas ${tabla}: ${conteo.rows[0].total}`);
  }

  const restricciones = await client.query(`
    SELECT nombres.nombre,
      EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public' AND c.conname = nombres.nombre
      ) AS existe
    FROM unnest($1::text[]) AS nombres(nombre)
  `, [['reservas_horas_ok', 'reservas_valor_ok', 'abonos_monto_positivo']]);

  const indices = await client.query(`
    SELECT nombres.nombre,
      EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname = nombres.nombre
      ) AS existe
    FROM unnest($1::text[]) AS nombres(nombre)
  `, [['ux_canchas_nombre', 'ux_reservas_slot_activo']]);

  for (const fila of [...restricciones.rows, ...indices.rows]) {
    resultado(fila.existe, `restricción/índice ${fila.nombre}`);
  }

  const rls = await client.query(`
    SELECT c.relname, c.relrowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = ANY($1::text[])
  `, [['canchas', 'clientes', 'reservas', 'abonos']]);
  const porTabla = new Map(rls.rows.map((fila) => [fila.relname, fila.relrowsecurity]));

  for (const tabla of ['canchas', 'clientes', 'reservas', 'abonos']) {
    resultado(porTabla.get(tabla) === true, `RLS activo en ${tabla}`);
  }

  return true;
}

async function verificarIntegridad() {
  let transaccionIniciada = false;

  try {
    await client.query('BEGIN');
    transaccionIniciada = true;

    const cancha = await client.query(
      'INSERT INTO canchas (nombre) VALUES ($1) RETURNING id',
      ['Verif C1'],
    );
    const canchaId = cancha.rows[0].id;
    resultado(true, 'a) Crear cancha Verif C1');

    await esperarError('a duplicado', '23505', 'ux_canchas_nombre', () =>
      client.query('INSERT INTO canchas (nombre) VALUES ($1)', ['verif c1']),
    );

    const cliente = await client.query(
      'INSERT INTO clientes (nombre, contacto) VALUES ($1, $2) RETURNING id',
      ['Verif Cli', '300'],
    );
    const clienteId = cliente.rows[0].id;
    resultado(true, 'b) Crear cliente Verif Cli');

    const fechaResultado = await client.query(
      'SELECT (CURRENT_DATE + 3)::text AS fecha',
    );
    const fecha = fechaResultado.rows[0].fecha;
    const reserva = await client.query(
      `INSERT INTO reservas
        (cancha_id, cliente_id, fecha, hora_inicio, hora_fin, valor_total, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'activa') RETURNING id`,
      [canchaId, clienteId, fecha, '18:00', '19:00', 50000],
    );
    const reservaId = reserva.rows[0].id;
    resultado(true, 'c) Crear reserva válida');

    await esperarError('d horas inválidas', '23514', 'reservas_horas_ok', () =>
      client.query(
        `INSERT INTO reservas
          (cancha_id, cliente_id, fecha, hora_inicio, hora_fin, valor_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [canchaId, clienteId, fecha, '19:00', '18:00', 50000],
      ),
    );

    await esperarError('e valor cero', '23514', 'reservas_valor_ok', () =>
      client.query(
        `INSERT INTO reservas
          (cancha_id, cliente_id, fecha, hora_inicio, hora_fin, valor_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [canchaId, clienteId, fecha, '20:00', '21:00', 0],
      ),
    );

    await esperarError('f franja duplicada', '23505', 'ux_reservas_slot_activo', () =>
      client.query(
        `INSERT INTO reservas
          (cancha_id, cliente_id, fecha, hora_inicio, hora_fin, valor_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [canchaId, clienteId, fecha, '18:00', '20:00', 50000],
      ),
    );

    await esperarError('g abono cero', '23514', 'abonos_monto_positivo', () =>
      client.query(
        'INSERT INTO abonos (reserva_id, monto, fecha) VALUES ($1, $2, $3)',
        [reservaId, 0, fecha],
      ),
    );

    await client.query(
      'INSERT INTO abonos (reserva_id, monto, fecha) VALUES ($1, $2, $3)',
      [reservaId, 20000, fecha],
    );
    const vista = await client.query(
      'SELECT abonado FROM v_reservas WHERE id = $1',
      [reservaId],
    );
    resultado(Number(vista.rows[0]?.abonado) === 20000, 'h) Vista calcula abonado 20000');
  } finally {
    if (transaccionIniciada) await client.query('ROLLBACK').catch(() => {});
  }
}

async function main() {
  try {
    await client.connect();
    const esquemaListo = await verificarEsquema();
    if (esquemaListo) await verificarIntegridad();
  } catch (error) {
    const mensaje = String(error.message ?? '').toLowerCase();
    const detalle =
      error.code ??
      error.cause?.code ??
      (mensaje.includes('timeout') ? 'timeout' : 'error sin código');
    console.error('FALLA conexión/verificación de base:', detalle);
    fallas += 1;
  } finally {
    await client.end().catch(() => {});
  }

  console.log(`Total de fallas: ${fallas}`);
  return fallas === 0 ? 0 : 1;
}

process.exitCode = await main();