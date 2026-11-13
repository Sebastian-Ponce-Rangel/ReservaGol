import { NextResponse } from 'next/server';
import { crearReservaPublica, listarBloquesOcupadosPublicos, listarCanchas } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esFechaValida } from '@/lib/reglas/fechas';
import { esquemaReservaPublica } from '@/lib/validacion/esquemas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export const dynamic = 'force-dynamic';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function diagnosticarCuerpo(cuerpo: unknown) {
  if (!esObjeto(cuerpo)) return { tipo: Array.isArray(cuerpo) ? 'arreglo' : typeof cuerpo };
  const cliente = esObjeto(cuerpo.clienteNuevo) ? cuerpo.clienteNuevo : null;

  return {
    campos: Object.keys(cuerpo),
    camposCliente: cliente ? Object.keys(cliente) : [],
    tipoCanchaId: typeof cuerpo.canchaId,
    fecha: typeof cuerpo.fecha === 'string' ? cuerpo.fecha : null,
    horaInicio: typeof cuerpo.horaInicio === 'string' ? cuerpo.horaInicio : null,
    horaFin: typeof cuerpo.horaFin === 'string' ? cuerpo.horaFin : null,
  };
}

type ErrorPostgres = Error & {
  code?: string;
  constraint?: string;
  table?: string;
  column?: string;
};

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

  if (process.env.NODE_ENV !== 'production') {
    let cuerpoRecibido: unknown;
    try {
      cuerpoRecibido = await request.clone().json();
    } catch (error) {
      console.warn('No se pudo interpretar el cuerpo JSON de la reserva pública.', error);
    }
    console.log('[POST /api/reservas/publica] cuerpo recibido (valores personales omitidos)', diagnosticarCuerpo(cuerpoRecibido));
  }

  const datos = await leerCuerpo(request, esquemaReservaPublica);
  let reserva: Awaited<ReturnType<typeof crearReservaPublica>>;
  try {
    reserva = await crearReservaPublica(datos);
  } catch (error) {
    const errorPostgres = error instanceof Error ? error as ErrorPostgres : null;
    if (errorPostgres?.code) {
      console.error('[POST /api/reservas/publica] error PostgreSQL', {
        codigo: errorPostgres.code,
        restriccion: errorPostgres.constraint,
        tabla: errorPostgres.table,
        columna: errorPostgres.column,
        ...(process.env.NODE_ENV === 'production' ? {} : { error: errorPostgres }),
      });
    }
    throw error;
  }
  return responderOk({
    id: reserva.id,
    valorTotal: reserva.valorTotal,
    anticipoRequerido: Math.ceil(reserva.valorTotal * 0.25),
    estadoPago: 'pendiente',
  }, 201);
});