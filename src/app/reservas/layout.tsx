import { NavegacionReservaGol } from '@/components/reservagol/NavegacionReservaGol';
import { NavegacionPublica } from '@/components/reservagol/NavegacionPublica';
import { obtenerSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export default async function ReservasLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();

  return (
    <div className="app-shell">
      {sesion
        ? <NavegacionReservaGol email={sesion.email} />
        : <NavegacionPublica />}
      {children}
    </div>
  );
}