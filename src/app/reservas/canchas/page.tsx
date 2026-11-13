import { AccionDesactivar } from '@/components/reservagol/AccionDesactivar';
import { FormularioCancha } from '@/components/reservagol/FormularioCancha';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Insignia } from '@/components/ui/Insignia';
import { listarCanchas } from '@/lib/dataService';
import { formatearPesos } from '@/lib/formato';
import { PRECIO_HORA_BASE } from '@/lib/config/reservagol';

export const dynamic = 'force-dynamic';

export default async function CanchasPage() {
  const canchas = await listarCanchas({ incluirInactivas: true });

  return (
    <main className="app-contenido">
      <header className="pagina-cabecera">
        <div>
          <p className="seccion-kicker">Administración</p>
          <h1>Canchas</h1>
        </div>
        <p className="pagina-conteo">{canchas.filter((cancha) => cancha.activa).length} activas</p>
      </header>
      <FormularioCancha />
      <section className="seccion-listado" aria-labelledby="lista-canchas-titulo">
        <div className="seccion-cabecera">
          <h2 id="lista-canchas-titulo">Todas las canchas</h2>
          <span className="pagina-conteo">{canchas.length}</span>
        </div>
        {canchas.length === 0 ? (
          <EstadoVacio titulo="No hay canchas" detalle="Agrega la primera cancha para empezar." />
        ) : (
          <ul className="lista-entidades">
            {canchas.map((cancha) => (
              <li className="fila-entidad" key={cancha.id}>
                <div className="entidad-principal">
                  <h3>{cancha.nombre}</h3>
                  <p>{formatearPesos(cancha.precioHora ?? PRECIO_HORA_BASE)}{cancha.precioHora == null ? ' · tarifa base' : ''}</p>
                </div>
                <div className="entidad-acciones">
                  <Insignia tono={cancha.activa ? 'verde' : 'neutro'}>
                    {cancha.activa ? 'Activa' : 'Inactiva'}
                  </Insignia>
                  {cancha.activa && (
                    <AccionDesactivar tipo="canchas" id={cancha.id} nombre={cancha.nombre} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}