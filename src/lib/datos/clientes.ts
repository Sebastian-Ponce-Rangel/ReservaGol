import type { PoolClient } from 'pg';
import { consultar } from '@/lib/db/conexion';
import { LIMITE_LISTADO } from '@/lib/config/reservagol';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { validarCliente } from '@/lib/reglas/cliente';
import { estadoPago, saldo } from '@/lib/reglas/pago';
import { esquemaCliente } from '@/lib/validacion/esquemas';
import type { Cliente, ClienteConReservas, DatosCliente, EstadoReserva } from './tipos';

type FilaCliente = {
  id: string;
  nombre: string;
  contacto: string;
  email: string | null;
  activo: boolean;
};

type FilaClienteConReserva = FilaCliente & {
  reservaId: string | null;
  canchaNombre: string | null;
  fecha: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  valorTotal: number | null;
  anticipoRequerido: boolean | null;
  estado: EstadoReserva | null;
  abonado: number | null;
};

export async function listarClientes(
  filtros: { incluirInactivos?: boolean } = {},
): Promise<Cliente[]> {
  return consultar<FilaCliente>(
    `SELECT id, nombre, contacto, email, activo
     FROM clientes
     WHERE ($1::boolean OR activo = true)
     ORDER BY lower(nombre), id
     LIMIT $2`,
    [filtros.incluirInactivos ?? false, LIMITE_LISTADO],
  );
}

export async function listarClientesConReservas(
  filtros: { incluirInactivos?: boolean } = {},
): Promise<ClienteConReservas[]> {
  const filas = await consultar<FilaClienteConReserva>(
    `WITH clientes_filtrados AS (
       SELECT id, nombre, contacto, email, activo
       FROM clientes
       WHERE ($1::boolean OR activo = true)
       ORDER BY lower(nombre), id
       LIMIT $2
     )
     SELECT
       c.id, c.nombre, c.contacto, c.email, c.activo,
       r.id AS "reservaId",
       r.cancha_nombre AS "canchaNombre",
       r.fecha::text AS fecha,
       r.hora_inicio AS "horaInicio",
       r.hora_fin AS "horaFin",
       r.valor_total AS "valorTotal",
       (r.metodo_anticipo IS NOT NULL) AS "anticipoRequerido",
       r.estado,
       r.abonado
     FROM clientes_filtrados c
     LEFT JOIN v_reservas r ON r.cliente_id = c.id
     ORDER BY lower(c.nombre), c.id, r.fecha DESC, r.hora_inicio DESC, r.id`,
    [filtros.incluirInactivos ?? false, LIMITE_LISTADO],
  );
  const clientesPorId = new Map<string, ClienteConReservas>();

  for (const fila of filas) {
    let cliente = clientesPorId.get(fila.id);
    if (!cliente) {
      cliente = {
        id: fila.id,
        nombre: fila.nombre,
        contacto: fila.contacto,
        email: fila.email,
        activo: fila.activo,
        reservas: [],
      };
      clientesPorId.set(cliente.id, cliente);
    }

    if (fila.reservaId === null) continue;
    if (
      fila.canchaNombre === null ||
      fila.fecha === null ||
      fila.horaInicio === null ||
      fila.horaFin === null ||
      fila.valorTotal === null ||
      fila.estado === null ||
      fila.abonado === null
    ) {
      throw new Error('La reserva asociada al cliente tiene datos incompletos.');
    }

    const valorTotal = Number(fila.valorTotal);
    const abonado = Number(fila.abonado);
    cliente.reservas.push({
      id: fila.reservaId,
      canchaNombre: fila.canchaNombre,
      fecha: fila.fecha,
      horaInicio: fila.horaInicio,
      horaFin: fila.horaFin,
      valorTotal,
      anticipoRequerido: fila.anticipoRequerido ? Math.ceil(valorTotal * 0.25) : null,
      abonado,
      saldo: saldo(valorTotal, abonado),
      estado: fila.estado,
      estadoPago: estadoPago(valorTotal, abonado),
    });
  }

  return [...clientesPorId.values()];
}

export async function crearCliente(datos: DatosCliente): Promise<{ id: string }> {
  const cliente = esquemaCliente.parse(datos);
  validarCliente(cliente);
  const filas = await consultar<{ id: string }>(
    `INSERT INTO clientes (nombre, contacto, email)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [cliente.nombre, cliente.contacto, cliente.email ?? null],
  );
  const creado = filas[0];
  if (!creado) throw new ErrorDeNegocio('ERROR_INTERNO');
  return creado;
}

export async function desactivarCliente(id: string): Promise<void> {
  const filas = await consultar<{ id: string }>(
    'UPDATE clientes SET activo = false WHERE id = $1 RETURNING id',
    [id],
  );
  if (filas.length === 0) throw new ErrorDeNegocio('CLIENTE_NO_ENCONTRADO');
}

export async function exigirClienteActivo(tx: PoolClient, id: string): Promise<void> {
  const resultado = await tx.query<{ id: string }>(
    'SELECT id FROM clientes WHERE id = $1 AND activo = true FOR SHARE',
    [id],
  );
  if (resultado.rowCount === 0) throw new ErrorDeNegocio('CLIENTE_NO_ENCONTRADO');
}