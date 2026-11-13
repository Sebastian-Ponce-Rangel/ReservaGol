import { NextResponse } from 'next/server';
import { crearReservaPublica, listarBloquesOcupadosPublicos, listarCanchas } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esFechaValida } from '@/lib/reglas/fechas';
import { esquemaReservaPublica } from '@/lib/validacion/esquemas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: Request) => {
  const parametros = new URL(request.url).searchParams;
  const desde = parametros.get('desde') ?? '';
  const hasta = parametros.get('hasta') ?? '';
  if (!esFechaValida(desde) || !esFechaValida(hasta) || hasta < desde) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  const dias = (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000;
  if (dias > 6) throw new ErrorDeNegocio('DATOS_INVALIDOS', 'El rango público no puede superar siete días.');

  const [canchas, ocupadas] = await Promise.all([
    listarCanchas(),
    listarBloquesOcupadosPublicos(desde, hasta),
  ]);
  return responderOk({ canchas, ocupadas });
});

export const POST = conManejoDeErrores(async (request: Request) => {
  const origen = request.headers.get('origin');
  if (!origen || new URL(origen).origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { ok: false, error: { codigo: 'NO_AUTORIZADO', mensaje: 'Origen no permitido.', detalles: null } },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const datos = await leerCuerpo(request, esquemaReservaPublica);
  const reserva = await crearReservaPublica(datos);
  return responderOk({
    id: reserva.id,
    valorTotal: reserva.valorTotal,
    anticipoRequerido: Math.ceil(reserva.valorTotal * 0.25),
    estadoPago: 'pendiente',
  }, 201);
});