import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import {
  DURACION_SESION_SEGUNDOS,
  firmarTokenSesion,
  NOMBRE_COOKIE_SESION,
} from '@/lib/auth/token';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esquemaLogin } from '@/lib/validacion/esquemas';

function sonIgualesConstantes(valor: string, esperado: string): boolean {
  const valorBytes = Buffer.from(valor);
  const esperadoBytes = Buffer.from(esperado);
  return (
    valorBytes.length === esperadoBytes.length &&
    timingSafeEqual(valorBytes, esperadoBytes)
  );
}

export const POST = conManejoDeErrores(async (request: Request) => {
  const credenciales = await leerCuerpo(request, esquemaLogin);
  const emailConfigurado = process.env.RESERVAGOL_ADMIN_EMAIL?.trim().toLowerCase();
  const passwordConfigurada = process.env.RESERVAGOL_ADMIN_PASSWORD;
  const secreto = process.env.RESERVAGOL_SESSION_SECRET;

  if (!emailConfigurado || !passwordConfigurada || !secreto) {
    throw new Error('Falta configurar las variables de autenticación de ReservaGol.');
  }

  const emailIngresado = credenciales.email.trim().toLowerCase();
  if (
    !sonIgualesConstantes(emailIngresado, emailConfigurado) ||
    !sonIgualesConstantes(credenciales.password, passwordConfigurada)
  ) {
    throw new ErrorDeNegocio('NO_AUTORIZADO');
  }

  const token = firmarTokenSesion(emailConfigurado, secreto);
  const respuesta: NextResponse = responderOk({ email: emailConfigurado });
  respuesta.cookies.set(NOMBRE_COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACION_SESION_SEGUNDOS,
  });

  return respuesta;
});