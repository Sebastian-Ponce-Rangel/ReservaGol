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
  const passwordConfigurada = process.env.RESERVAGOL_ADMIN_PASSWORD?.trim();
  const secreto = process.env.RESERVAGOL_SESSION_SECRET;

  if (!emailConfigurado || !passwordConfigurada || !secreto) {
    throw new ErrorDeNegocio(
      'ERROR_INTERNO',
      'El acceso no está configurado. Define RESERVAGOL_ADMIN_EMAIL, RESERVAGOL_ADMIN_PASSWORD y RESERVAGOL_SESSION_SECRET en el entorno local.',
    );
  }

  const emailIngresado = credenciales.email.trim().toLowerCase();
  const passwordIngresada = credenciales.password.trim();
  const correoCoincide = sonIgualesConstantes(emailIngresado, emailConfigurado);
  const passwordCoincide = sonIgualesConstantes(passwordIngresada, passwordConfigurada);

  if (!correoCoincide || !passwordCoincide) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[auth/login] Rechazo de credenciales', {
        correoCoincide,
        passwordCoincide,
      });
    }
    throw new ErrorDeNegocio('NO_AUTORIZADO', 'Correo o contraseña incorrectos.');
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