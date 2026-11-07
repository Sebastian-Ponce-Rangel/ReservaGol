import { NextResponse, type NextRequest } from 'next/server';
import { NOMBRE_COOKIE_SESION, verificarTokenSesion } from '@/lib/auth/token';
import { MENSAJES } from '@/lib/reglas/errores';

export function proxy(request: NextRequest): NextResponse {
  const token = request.cookies.get(NOMBRE_COOKIE_SESION)?.value;
  const secreto = process.env.RESERVAGOL_SESSION_SECRET ?? '';
  if (token && verificarTokenSesion(token, secreto)) return NextResponse.next();

  const esApi =
    request.nextUrl.pathname === '/api/reservas' ||
    request.nextUrl.pathname.startsWith('/api/reservas/');

  if (esApi) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          codigo: 'NO_AUTORIZADO',
          mensaje: MENSAJES.NO_AUTORIZADO,
          detalles: null,
        },
      },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const urlLogin = request.nextUrl.clone();
  urlLogin.pathname = '/login';
  urlLogin.search = '';
  const respuesta = NextResponse.redirect(urlLogin);
  respuesta.headers.set('Cache-Control', 'no-store');
  return respuesta;
}

export const config = {
  matcher: ['/reservas/:path*', '/api/reservas/:path*'],
};