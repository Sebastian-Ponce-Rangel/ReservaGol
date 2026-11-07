import { crearCancha, listarCanchas } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { exigirSesion } from '@/lib/auth/sesion';
import { esquemaCancha } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const incluir = new URL(request.url).searchParams.get('incluirInactivas');
  if (incluir !== null && incluir !== 'true' && incluir !== 'false') {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  return responderOk(await listarCanchas({ incluirInactivas: incluir === 'true' }));
});

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const datos = await leerCuerpo(request, esquemaCancha);
  return responderOk(await crearCancha(datos), 201);
});