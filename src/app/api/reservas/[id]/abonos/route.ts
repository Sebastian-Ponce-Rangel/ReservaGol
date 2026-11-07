import { registrarAbono } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { exigirSesion } from '@/lib/auth/sesion';
import { esquemaAbono } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type ContextoRuta = {
  params: Promise<{ id: string }>;
};

export const POST = conManejoDeErrores(async (request: Request, contexto: ContextoRuta) => {
  await exigirSesion();
  const { id } = await contexto.params;
  const datos = await leerCuerpo(request, esquemaAbono);
  return responderOk(await registrarAbono(id, datos.monto), 201);
});