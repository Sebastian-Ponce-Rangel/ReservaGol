import { crearCliente, listarClientes } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { exigirSesion } from '@/lib/auth/sesion';
import { esquemaCliente } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const incluir = new URL(request.url).searchParams.get('incluirInactivos');
  if (incluir !== null && incluir !== 'true' && incluir !== 'false') {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  return responderOk(await listarClientes({ incluirInactivos: incluir === 'true' }));
});

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const datos = await leerCuerpo(request, esquemaCliente);
  return responderOk(await crearCliente(datos), 201);
});