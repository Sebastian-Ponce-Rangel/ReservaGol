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
      <section className="landing-hero relative">
        <div className="absolute inset-x-1/4 top-1/4 h-48 -translate-y-1/2 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute left-1/4 top-1/4 h-24 w-24 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute right-1/4 top-1/3 h-24 w-24 rounded-full bg-rose-500/10 blur-3xl" />
        </div>
        <p className="landing-eyebrow text-emerald-400">RESERVAS DEPORTIVAS</p>
        <h1 className="text-white">Tu próxima cancha empieza aquí</h1>
        <p>Encuentra un horario disponible y asegura tu próximo partido.</p>
        <Link className="landing-cta text-white font-semibold" href="/reservas">Reservar ahora</Link>
      </section>
      <footer className="landing-footer">ReservaGol · Canchas, horarios y partidos</footer>
    </main>
  );
}
