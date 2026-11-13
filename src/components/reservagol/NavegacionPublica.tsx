import Link from 'next/link';
import { Trophy } from 'lucide-react';

export function NavegacionPublica() {
  return (
    <header className="public-nav">
      <div className="public-nav-interior">
        <Link className="public-brand" href="/" aria-label="ReservaGol, inicio">
          <span className="public-brand-mark" aria-hidden="true"><Trophy size={18} /></span>
          <span>ReservaGol</span>
        </Link>
        <Link className="public-owner-link" href="/login">Soy Propietario</Link>
      </div>
    </header>
  );
}