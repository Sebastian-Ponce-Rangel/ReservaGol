import { NextResponse } from 'next/server';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { NOMBRE_COOKIE_SESION } from '@/lib/auth/token';

export const POST = conManejoDeErrores(async () => {
  const respuesta: NextResponse = responderOk({ sesion: false });
  respuesta.cookies.set(NOMBRE_COOKIE_SESION, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return respuesta;
});