import Link from 'next/link';
import { Trophy } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="landing-page">
      <header className="landing-nav w-full px-8 py-4 bg-[#0B1120]/90 backdrop-blur-md border-b border-white/10">
        <Link className="public-brand" href="/" aria-label="ReservaGol, inicio">
          <span className="public-brand-mark" aria-hidden="true"><Trophy size={18} /></span>
          <span>ReservaGol</span>
        </Link>
        <Link
          className="landing-owner px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-500/15 border border-emerald-400/50 text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
          href="/login"
        >
          Soy Propietario
        </Link>
      </header>
      <section className="landing-hero">
        <p className="landing-eyebrow">RESERVAS DEPORTIVAS</p>
        <h1>
          <span className="text-white">Tu próxima</span>{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-rose-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(16,185,129,0.35)]">
            cancha empieza aquí
          </span>
        </h1>
        <p>Encuentra un horario disponible y asegura tu próximo partido.</p>
        <Link className="landing-cta" href="/reservas">Reservar ahora</Link>
      </section>
      <footer className="landing-footer">ReservaGol · Canchas, horarios y partidos</footer>
    </main>
  );
}
