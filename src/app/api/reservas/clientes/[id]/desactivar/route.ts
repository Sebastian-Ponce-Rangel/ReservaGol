import { desactivarCliente } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { exigirSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

type ContextoRuta = {
  params: Promise<{ id: string }>;
};

export const POST = conManejoDeErrores(async (_request: Request, contexto: ContextoRuta) => {
  await exigirSesion();
  const { id } = await contexto.params;
  await desactivarCliente(id);
  return responderOk({ desactivada: true });
});