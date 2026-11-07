import { describe, expect, it } from 'vitest';
import {
  DURACION_SESION_SEGUNDOS,
  firmarTokenSesion,
  verificarTokenSesion,
} from '@/lib/auth/token';

const SECRETO = 'secreto-de-prueba-con-entropia-suficiente-123456';
const AHORA = Date.UTC(2026, 10, 7, 12, 0, 0);

describe('token de sesión', () => {
  it('firma y verifica una sesión no vencida', () => {
    const token = firmarTokenSesion('admin@reservagol.com', SECRETO, AHORA);

    expect(verificarTokenSesion(token, SECRETO, AHORA)).toEqual({
      email: 'admin@reservagol.com',
    });
  });

  it('rechaza una firma manipulada', () => {
    const token = firmarTokenSesion('admin@reservagol.com', SECRETO, AHORA);
    const alterado = `${token.slice(0, -1)}x`;

    expect(verificarTokenSesion(alterado, SECRETO, AHORA)).toBeNull();
  });

  it('rechaza una firma creada con otra clave', () => {
    const token = firmarTokenSesion('admin@reservagol.com', SECRETO, AHORA);

    expect(verificarTokenSesion(token, `${SECRETO}otra`, AHORA)).toBeNull();
  });

  it('rechaza una sesión vencida', () => {
    const token = firmarTokenSesion('admin@reservagol.com', SECRETO, AHORA);
    const despuesDelVencimiento = AHORA + (DURACION_SESION_SEGUNDOS + 1) * 1000;

    expect(verificarTokenSesion(token, SECRETO, despuesDelVencimiento)).toBeNull();
  });

  it('exige una clave de al menos 32 caracteres para firmar', () => {
    expect(() => firmarTokenSesion('admin@reservagol.com', 'corta', AHORA)).toThrow(
      'RESERVAGOL_SESSION_SECRET debe tener al menos 32 caracteres.',
    );
  });
});