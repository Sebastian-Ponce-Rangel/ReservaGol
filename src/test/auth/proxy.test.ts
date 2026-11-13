import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxy } from '@/proxy';
import {
  firmarTokenSesion,
  NOMBRE_COOKIE_SESION,
} from '@/lib/auth/token';

const SECRETO = 'secreto-de-prueba-con-entropia-suficiente-123456';

describe('proxy de sesión', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('responde 401 JSON sin sesión para la API', async () => {
    const request = new NextRequest('http://localhost/api/reservas/sesion');
    const respuesta = proxy(request);
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(401);
    expect(cuerpo.error.codigo).toBe('NO_AUTORIZADO');
    expect(respuesta.headers.get('Cache-Control')).toBe('no-store');
  });

  it('permite la página pública de reservas sin sesión', () => {
    const request = new NextRequest('http://localhost/reservas');
    const respuesta = proxy(request);

    expect(respuesta.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirige páginas administrativas al login sin sesión', () => {
    const request = new NextRequest('http://localhost/admin');
    const respuesta = proxy(request);

    expect(respuesta.status).toBe(307);
    expect(respuesta.headers.get('location')).toBe('http://localhost/login');
  });

  it('redirige también subrutas del panel administrativo', () => {
    const request = new NextRequest('http://localhost/admin/reportes');
    const respuesta = proxy(request);

    expect(respuesta.status).toBe(307);
    expect(respuesta.headers.get('location')).toBe('http://localhost/login');
  });

  it('mantiene protegidas las páginas administrativas heredadas', () => {
    const request = new NextRequest('http://localhost/reservas/canchas');
    const respuesta = proxy(request);

    expect(respuesta.status).toBe(307);
    expect(respuesta.headers.get('location')).toBe('http://localhost/login');
  });

  it('permite solo el endpoint público específico sin sesión', () => {
    const request = new NextRequest('http://localhost/api/reservas/publica');
    const respuesta = proxy(request);

    expect(respuesta.headers.get('x-middleware-next')).toBe('1');
  });

  it('deja pasar una cookie firmada válida', () => {
    vi.stubEnv('RESERVAGOL_SESSION_SECRET', SECRETO);
    const token = firmarTokenSesion('admin@reservagol.com', SECRETO);
    const request = new NextRequest('http://localhost/reservas', {
      headers: { cookie: `${NOMBRE_COOKIE_SESION}=${token}` },
    });
    const respuesta = proxy(request);

    expect(respuesta.headers.get('x-middleware-next')).toBe('1');
  });
});