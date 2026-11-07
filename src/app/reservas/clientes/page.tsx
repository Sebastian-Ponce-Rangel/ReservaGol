import { AccionDesactivar } from '@/components/reservagol/AccionDesactivar';
import { FormularioCliente } from '@/components/reservagol/FormularioCliente';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Insignia } from '@/components/ui/Insignia';
import { listarClientes } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const clientes = await listarClientes({ incluirInactivos: true });

  return (
    <main className="app-contenido">
      <header className="pagina-cabecera">
        <div>
          <p className="seccion-kicker">Administración</p>
          <h1>Clientes</h1>
        </div>
        <p className="pagina-conteo">{clientes.filter((cliente) => cliente.activo).length} activos</p>
      </header>
      <FormularioCliente />
      <section className="seccion-listado" aria-labelledby="lista-clientes-titulo">
        <div className="seccion-cabecera">
          <h2 id="lista-clientes-titulo">Todos los clientes</h2>
          <span className="pagina-conteo">{clientes.length}</span>
        </div>
        {clientes.length === 0 ? (
          <EstadoVacio titulo="No hay clientes" detalle="Agrega el primer cliente para empezar." />
        ) : (
          <ul className="lista-entidades">
            {clientes.map((cliente) => (
              <li className="fila-entidad" key={cliente.id}>
                <div className="entidad-principal">
                  <h3>{cliente.nombre}</h3>
                  <p>{cliente.contacto}</p>
                </div>
                <div className="entidad-acciones">
                  <Insignia tono={cliente.activo ? 'verde' : 'neutro'}>
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </Insignia>
                  {cliente.activo && (
                    <AccionDesactivar tipo="clientes" id={cliente.id} nombre={cliente.nombre} />
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