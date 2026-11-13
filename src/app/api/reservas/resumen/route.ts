import { resumenCobros } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { exigirSesion } from '@/lib/auth/sesion';
import { esquemaRangoResumen } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const parametros = new URL(request.url).searchParams;
  const rango = esquemaRangoResumen.parse({
    desde: parametros.get('desde'),
    hasta: parametros.get('hasta'),
  });
  return responderOk(await resumenCobros(rango.desde, rango.hasta));
});