import { createHmac, timingSafeEqual } from 'node:crypto';

export const NOMBRE_COOKIE_SESION = 'reservagol_sesion';
export const DURACION_SESION_SEGUNDOS = 60 * 60 * 24 * 7;

type DatosSesion = {
  email: string;
  expiraEn: number;
};

function firmarCuerpo(cuerpo: string, secreto: string): Buffer {
  return createHmac('sha256', secreto).update(cuerpo).digest();
}

export function firmarTokenSesion(
  email: string,
  secreto: string,
  ahora: number = Date.now(),
): string {
  if (secreto.length < 32) {
    throw new Error('RESERVAGOL_SESSION_SECRET debe tener al menos 32 caracteres.');
  }

  const datos: DatosSesion = {
    email,
    expiraEn: Math.floor(ahora / 1000) + DURACION_SESION_SEGUNDOS,
  };
  const cuerpo = Buffer.from(JSON.stringify(datos)).toString('base64url');
  const firma = firmarCuerpo(cuerpo, secreto).toString('base64url');

  return `${cuerpo}.${firma}`;
}

export function verificarTokenSesion(
  token: string,
  secreto: string,
  ahora: number = Date.now(),
): { email: string } | null {
  if (secreto.length < 32) return null;

  const [cuerpo, firmaCodificada, extra] = token.split('.');
  if (!cuerpo || !firmaCodificada || extra !== undefined) return null;

  try {
    const firmaRecibida = Buffer.from(firmaCodificada, 'base64url');
    const firmaEsperada = firmarCuerpo(cuerpo, secreto);
    if (
      firmaRecibida.length !== firmaEsperada.length ||
      !timingSafeEqual(firmaRecibida, firmaEsperada)
    ) {
      return null;
    }

    const datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8')) as Partial<DatosSesion>;
    if (
      typeof datos.email !== 'string' ||
      !datos.email ||
      typeof datos.expiraEn !== 'number' ||
      !Number.isInteger(datos.expiraEn) ||
      datos.expiraEn <= Math.floor(ahora / 1000)
    ) {
      return null;
    }

    return { email: datos.email };
  } catch {
    return null;
  }
}