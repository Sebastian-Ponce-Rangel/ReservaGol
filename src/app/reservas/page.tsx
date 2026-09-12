import { ReservaList } from '@/features/reservas/ReservaList';

export default function ReservasPage() {
  return (
    <main className="page-shell">
      <section className="reservas-view">
        <ReservaList />
      </section>
    </main>
  );
}
