import { ReservaList } from '@/features/reservas/ReservaList';
import { listarReservas } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export default async function ReservasPage() {
  const reservas = await listarReservas({ estado: 'activa' });

  return (
    <main className="app-contenido">
      <header className="pagina-cabecera">
        <div>
          <p className="seccion-kicker">Operación diaria</p>
          <h1>Agenda</h1>
        </div>
        <p className="pagina-conteo">{reservas.length} activas</p>
      </header>
      <section className="seccion-listado">
        <ReservaList reservas={reservas} />
      </section>
    </main>
  );
}
