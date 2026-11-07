import { redirect } from 'next/navigation';
import { obtenerSesion } from '@/lib/auth/sesion';

export default async function HomePage() {
  const sesion = await obtenerSesion();
  redirect(sesion ? '/reservas' : '/login');
}
