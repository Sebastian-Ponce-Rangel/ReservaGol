import { redirect } from 'next/navigation';
import { NavegacionReservaGol } from '@/components/reservagol/NavegacionReservaGol';
import { obtenerSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export default async function ReservasLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login');

  return (
    <div className="app-shell">
      <NavegacionReservaGol email={sesion.email} />
      {children}
    </div>
  );
}