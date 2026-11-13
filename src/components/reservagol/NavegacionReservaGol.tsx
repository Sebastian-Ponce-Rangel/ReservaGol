'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, LayoutDashboard, LogOut, MapPin, Trophy, UsersRound } from 'lucide-react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';

type NavegacionReservaGolProps = {
  email: string;
};

const ENLACES = [
  { href: '/admin', texto: 'Contaduría', Icono: LayoutDashboard },
  { href: '/reservas/canchas', texto: 'Canchas', Icono: MapPin },
  { href: '/reservas/clientes', texto: 'Clientes', Icono: UsersRound },
  { href: '/reservas/resumen', texto: 'Resumen', Icono: BarChart3 },
  { href: '/reservas', texto: 'Reservar', Icono: Trophy },
];

export function NavegacionReservaGol({ email }: NavegacionReservaGolProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [error, setError] = useState('');

  async function cerrarSesion() {
    setCerrandoSesion(true);
    setError('');
    try {
      const respuesta = await fetch('/api/auth/logout', { method: 'POST' });
      if (!respuesta.ok) throw new Error('No fue posible cerrar sesión.');
      router.replace('/login');
      router.refresh();
    } catch {
      setError('No fue posible cerrar sesión. Intenta de nuevo.');
      setCerrandoSesion(false);
    }
  }

  return (
    <header className="app-nav backdrop-blur-md">
      <div className="app-nav-superior">
        <div className="app-nav-interior">
          <Link className="app-brand" href="/reservas" aria-label="ReservaGol, agenda">
            <span className="app-brand-marca app-brand-marca--deportiva" aria-hidden="true">
              <Trophy size={17} strokeWidth={2} />
            </span>
            <span>ReservaGol</span>
          </Link>
          <div className="app-cuenta">
            <span className="app-email" title={email}>{email}</span>
            <Boton variante="secundario" className="app-logout" type="button" onClick={cerrarSesion} disabled={cerrandoSesion}>
              <LogOut aria-hidden="true" size={16} strokeWidth={1.8} />
              {cerrandoSesion ? 'Saliendo...' : 'Cerrar sesión'}
            </Boton>
          </div>
        </div>
      </div>
      <div className="app-nav-inferior">
        <nav className="app-links" aria-label="Navegación principal">
          {ENLACES.map((enlace) => {
            const activo = pathname === enlace.href ||
              (enlace.href !== '/reservas' && pathname.startsWith(`${enlace.href}/`));
            const Icono = enlace.Icono;
            return (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={activo ? 'app-link app-link--activo' : 'app-link'}
                aria-current={activo ? 'page' : undefined}
              >
                <Icono className="app-link-icon" aria-hidden="true" size={17} strokeWidth={1.8} />
                {enlace.texto}
              </Link>
            );
          })}
        </nav>
      </div>
      {error && <Aviso tono="error" className="app-nav-error">{error}</Aviso>}
    </header>
  );
}