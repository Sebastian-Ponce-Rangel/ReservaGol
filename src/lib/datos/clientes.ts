import type { PoolClient } from 'pg';
import { consultar } from '@/lib/db/conexion';
import { LIMITE_LISTADO } from '@/lib/config/reservagol';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { validarCliente } from '@/lib/reglas/cliente';
import { esquemaCliente } from '@/lib/validacion/esquemas';
import type { Cliente, DatosCliente } from './tipos';

type FilaCliente = {
  id: string;
  nombre: string;
  contacto: string;
  activo: boolean;
};

export async function listarClientes(
  filtros: { incluirInactivos?: boolean } = {},
): Promise<Cliente[]> {
  return consultar<FilaCliente>(
    `SELECT id, nombre, contacto, activo
     FROM clientes
     WHERE ($1::boolean OR activo = true)
     ORDER BY lower(nombre), id
     LIMIT $2`,
    [filtros.incluirInactivos ?? false, LIMITE_LISTADO],
  );
}

export async function crearCliente(datos: DatosCliente): Promise<{ id: string }> {
  const cliente = esquemaCliente.parse(datos);
  validarCliente(cliente);
  const filas = await consultar<{ id: string }>(
    `INSERT INTO clientes (nombre, contacto)
     VALUES ($1, $2)
     RETURNING id`,
    [cliente.nombre, cliente.contacto],
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