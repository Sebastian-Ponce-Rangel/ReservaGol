import { cookies } from 'next/headers';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { NOMBRE_COOKIE_SESION, verificarTokenSesion } from './token';

export type Sesion = {
  email: string;
};

export async function obtenerSesion(): Promise<Sesion | null> {
  const secreto = process.env.RESERVAGOL_SESSION_SECRET;
  if (!secreto) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(NOMBRE_COOKIE_SESION)?.value;
  if (!token) return null;

  return verificarTokenSesion(token, secreto);
}

export async function exigirSesion(): Promise<Sesion> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new ErrorDeNegocio('NO_AUTORIZADO');
  return sesion;
}