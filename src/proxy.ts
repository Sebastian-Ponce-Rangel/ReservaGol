import { NextResponse, type NextRequest } from 'next/server';
import { NOMBRE_COOKIE_SESION, verificarTokenSesion } from '@/lib/auth/token';
import { MENSAJES } from '@/lib/reglas/errores';

export function proxy(request: NextRequest): NextResponse {
  const token = request.cookies.get(NOMBRE_COOKIE_SESION)?.value;
  const secreto = process.env.RESERVAGOL_SESSION_SECRET ?? '';
  if (token && verificarTokenSesion(token, secreto)) return NextResponse.next();

  const ruta = request.nextUrl.pathname;
  const esReservaPublica = ruta === '/reservas';
  const esApiPublica = ruta === '/api/reservas/publica';
  if (esReservaPublica || esApiPublica) return NextResponse.next();

  const esApi =
    ruta === '/api/reservas' ||
    ruta.startsWith('/api/reservas/');
  const esPaginaProtegida = ruta === '/admin' || ruta.startsWith('/admin/') || ruta.startsWith('/reservas/');

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

  if (!esPaginaProtegida) return NextResponse.next();

  const urlLogin = request.nextUrl.clone();
  urlLogin.pathname = '/login';
  urlLogin.search = '';
  const respuesta = NextResponse.redirect(urlLogin);
  respuesta.headers.set('Cache-Control', 'no-store');
  return respuesta;
}

export const config = {
  matcher: ['/reservas/:path*', '/admin/:path*', '/api/reservas/:path*'],
};