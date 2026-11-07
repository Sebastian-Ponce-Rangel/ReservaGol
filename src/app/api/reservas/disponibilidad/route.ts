import { disponibilidad } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { exigirSesion } from '@/lib/auth/sesion';
import { esquemaDisponibilidad } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirSesion();
  const parametros = new URL(request.url).searchParams;
  const consulta = esquemaDisponibilidad.parse({
    canchaId: parametros.get('canchaId'),
    fecha: parametros.get('fecha'),
  });
  return responderOk(await disponibilidad(consulta.canchaId, consulta.fecha));
});