import { NextResponse } from 'next/server';
import { ZodError, type z } from 'zod';
import { ESTADO_HTTP, ErrorDeNegocio, type CodigoError, MENSAJES } from '@/lib/reglas/errores';

const CABECERAS_SIN_CACHE = { 'Cache-Control': 'no-store' };

export function responderOk<T>(datos: T, estado = 200): NextResponse {
  return NextResponse.json(
    { ok: true, datos },
    { status: estado, headers: CABECERAS_SIN_CACHE },
  );
}

function codigoDePostgres(error: unknown): CodigoError | null {
  if (typeof error !== 'object' || error === null) return null;

  const errorPostgres = error as { code?: unknown; constraint?: unknown };
  if (errorPostgres.code === '23503') return 'TIENE_DEPENDENCIAS';
  if (errorPostgres.code === '23514') return 'DATOS_INVALIDOS';
  if (errorPostgres.code === '23505') {
    if (errorPostgres.constraint === 'ux_canchas_nombre') return 'CANCHA_DUPLICADA';
    if (errorPostgres.constraint === 'ux_reservas_slot_activo') return 'CHOQUE_HORARIO';
  }

  return null;
}

export function responderError(error: unknown): NextResponse {
  if (error instanceof ErrorDeNegocio) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          codigo: error.codigo,
          mensaje: error.message,
          detalles: error.detalles ?? null,
        },
      },
      { status: ESTADO_HTTP[error.codigo], headers: CABECERAS_SIN_CACHE },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          codigo: 'DATOS_INVALIDOS',
          mensaje: MENSAJES.DATOS_INVALIDOS,
          detalles: error.flatten(),
        },
      },
      { status: ESTADO_HTTP.DATOS_INVALIDOS, headers: CABECERAS_SIN_CACHE },
    );
  }

  const codigo = codigoDePostgres(error);
  if (codigo) {
    return NextResponse.json(
      {
        ok: false,
        error: { codigo, mensaje: MENSAJES[codigo], detalles: null },
      },
      { status: ESTADO_HTTP[codigo], headers: CABECERAS_SIN_CACHE },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      ok: false,
      error: {
        codigo: 'ERROR_INTERNO',
        mensaje: MENSAJES.ERROR_INTERNO,
        detalles: null,
      },
    },
    { status: ESTADO_HTTP.ERROR_INTERNO, headers: CABECERAS_SIN_CACHE },
  );
}

export function conManejoDeErrores<Argumentos extends unknown[]>(
  manejador: (...argumentos: Argumentos) => Response | Promise<Response>,
): (...argumentos: Argumentos) => Promise<Response> {
  return async (...argumentos) => {
    try {
      return await manejador(...argumentos);
    } catch (error) {
      return responderError(error);
    }
  };
}

export async function leerCuerpo<Esquema extends z.ZodType>(
  request: Request,
  esquema: Esquema,
): Promise<z.output<Esquema>> {
  let cuerpo: unknown;

  try {
    cuerpo = await request.json();
  } catch {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  return esquema.parse(cuerpo);
}