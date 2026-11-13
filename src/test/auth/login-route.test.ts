import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import { NOMBRE_COOKIE_SESION } from '@/lib/auth/token';

const EMAIL = 'admin@reservagol.com';
const PASSWORD = 'clave-de-prueba';
const SECRETO = 'secreto-de-prueba-con-entropia-suficiente-123456';

function crearRequest(cuerpo: unknown): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
}

describe('POST /api/auth/login', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('crea una cookie HttpOnly para credenciales correctas', async () => {
    vi.stubEnv('RESERVAGOL_ADMIN_EMAIL', EMAIL);
    vi.stubEnv('RESERVAGOL_ADMIN_PASSWORD', PASSWORD);
    vi.stubEnv('RESERVAGOL_SESSION_SECRET', SECRETO);
    const respuesta = await POST(crearRequest({ email: EMAIL, password: PASSWORD }));
    const cuerpo = await respuesta.json();
    const cookie = respuesta.headers.get('set-cookie') ?? '';

    expect(respuesta.status).toBe(200);
    expect(cuerpo).toMatchObject({ ok: true, datos: { email: EMAIL } });
    expect(cookie).toContain(`${NOMBRE_COOKIE_SESION}=`);
    expect(cookie.toLowerCase()).toContain('httponly');
    expect(cookie.toLowerCase()).toContain('samesite=lax');
    expect(respuesta.headers.get('Cache-Control')).toBe('no-store');
  });

  it('recorta espacios accidentales del correo y la contraseña', async () => {
    vi.stubEnv('RESERVAGOL_ADMIN_EMAIL', ` ${EMAIL} `);
    vi.stubEnv('RESERVAGOL_ADMIN_PASSWORD', ` ${PASSWORD} `);
    vi.stubEnv('RESERVAGOL_SESSION_SECRET', SECRETO);

    const respuesta = await POST(crearRequest({
      email: ` ${EMAIL} `,
      password: ` ${PASSWORD}\n`,
    }));

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get('set-cookie')).toContain(`${NOMBRE_COOKIE_SESION}=`);
  });

  it('rechaza credenciales incorrectas sin emitir cookie', async () => {
    vi.stubEnv('RESERVAGOL_ADMIN_EMAIL', EMAIL);
    vi.stubEnv('RESERVAGOL_ADMIN_PASSWORD', PASSWORD);
    vi.stubEnv('RESERVAGOL_SESSION_SECRET', SECRETO);
    const respuesta = await POST(crearRequest({ email: EMAIL, password: 'incorrecta' }));
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(401);
    expect(cuerpo.error.codigo).toBe('NO_AUTORIZADO');
    expect(cuerpo.error.mensaje).toBe('Correo o contraseña incorrectos.');
    expect(respuesta.headers.get('set-cookie')).toBeNull();
  });

  it('explica cuando faltan las variables de autenticación', async () => {
    vi.stubEnv('RESERVAGOL_ADMIN_EMAIL', '');
    vi.stubEnv('RESERVAGOL_ADMIN_PASSWORD', '');
    vi.stubEnv('RESERVAGOL_SESSION_SECRET', '');

    const respuesta = await POST(crearRequest({ email: EMAIL, password: PASSWORD }));
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(500);
    expect(cuerpo.error.codigo).toBe('ERROR_INTERNO');
    expect(cuerpo.error.mensaje).toContain('RESERVAGOL_ADMIN_EMAIL');
    expect(cuerpo.error.mensaje).toContain('RESERVAGOL_SESSION_SECRET');
  });
});