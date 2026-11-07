'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';

type NavegacionReservaGolProps = {
  email: string;
};

const ENLACES = [
  { href: '/reservas', texto: 'Agenda' },
  { href: '/reservas/canchas', texto: 'Canchas' },
  { href: '/reservas/clientes', texto: 'Clientes' },
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
    <header className="app-nav">
      <div className="app-nav-interior">
        <Link className="app-brand" href="/reservas" aria-label="ReservaGol, agenda">
          <span className="app-brand-marca" aria-hidden="true">RG</span>
          <span>ReservaGol</span>
        </Link>
        <nav className="app-links" aria-label="Navegación principal">
          {ENLACES.map((enlace) => {
            const activo = pathname === enlace.href ||
              (enlace.href !== '/reservas' && pathname.startsWith(`${enlace.href}/`));
            return (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={activo ? 'app-link app-link--activo' : 'app-link'}
                aria-current={activo ? 'page' : undefined}
              >
                {enlace.texto}
              </Link>
            );
          })}
        </nav>
        <div className="app-cuenta">
          <span className="app-email" title={email}>{email}</span>
          <Boton variante="secundario" type="button" onClick={cerrarSesion} disabled={cerrandoSesion}>
            {cerrandoSesion ? 'Saliendo...' : 'Cerrar sesión'}
          </Boton>
        </div>
      </div>
      {error && <Aviso tono="error" className="app-nav-error">{error}</Aviso>}
    </header>
  );
}