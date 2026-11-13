import Link from 'next/link';
import { Trophy } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="public-brand" href="/" aria-label="ReservaGol, inicio">
          <span className="public-brand-mark" aria-hidden="true"><Trophy size={18} /></span>
          <span>ReservaGol</span>
        </Link>
        <Link className="landing-owner" href="/login">Soy Propietario</Link>
      </header>
      <section className="landing-hero">
        <p className="landing-eyebrow">RESERVAS DEPORTIVAS</p>
        <h1>Tu próxima cancha empieza aquí</h1>
        <p>Encuentra un horario disponible y asegura tu próximo partido.</p>
        <Link className="landing-cta" href="/reservas">Reservar ahora</Link>
      </section>
      <footer className="landing-footer">ReservaGol · Canchas, horarios y partidos</footer>
    </main>
  );
}
