import {
  crearReserva,
  listarReservas,
} from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { exigirSesion } from '@/lib/auth/sesion';
import {
  esquemaFiltrosReservas,
  esquemaReserva,
} from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const parametros = new URL(request.url).searchParams;
  const filtros = esquemaFiltrosReservas.parse({
    ...(parametros.has('canchaId') ? { canchaId: parametros.get('canchaId') } : {}),
    ...(parametros.has('fecha') ? { fecha: parametros.get('fecha') } : {}),
    ...(parametros.has('estado') ? { estado: parametros.get('estado') } : {}),
  });
  return responderOk(await listarReservas(filtros));
});

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const datos = await leerCuerpo(request, esquemaReserva);
  return responderOk(await crearReserva(datos), 201);
});