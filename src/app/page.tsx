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
        <div className="absolute left-1/2 top-1/2 h-56 w-[min(70vw,44rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-3xl opacity-20 pointer-events-none" aria-hidden="true" />
        <p className="landing-eyebrow text-emerald-400 font-semibold tracking-widest uppercase">RESERVAS DEPORTIVAS</p>
        <h1 className="text-white font-extrabold">Tu próxima cancha empieza aquí</h1>
        <p>Encuentra un horario disponible y asegura tu próximo partido.</p>
        <Link className="landing-cta text-white font-semibold" href="/reservas">Reservar ahora</Link>
      </section>
      <footer className="landing-footer">ReservaGol · Canchas, horarios y partidos</footer>
    </main>
  );
}
