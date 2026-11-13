import { AccionDesactivar } from '@/components/reservagol/AccionDesactivar';
import { ActualizarDatosEnVivo } from '@/components/reservagol/ActualizarDatosEnVivo';
import { FormularioCliente } from '@/components/reservagol/FormularioCliente';
import { InsigniaEstadoPago } from '@/components/reservagol/InsigniaEstadoPago';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Insignia } from '@/components/ui/Insignia';
import { listarClientesConReservas } from '@/lib/dataService';
import { formatearFecha, formatearHora, formatearPesos } from '@/lib/formato';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const clientes = await listarClientesConReservas({ incluirInactivos: true });

  return (
    <main className="app-contenido">
      <ActualizarDatosEnVivo />
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
              <li className="fila-entidad cliente-fila" key={cliente.id}>
                <div className="entidad-principal">
                  <h3>{cliente.nombre}</h3>
                  <p>Teléfono: {cliente.contacto}</p>
                  <p>Correo: {cliente.email || 'No registrado'}</p>
                </div>
                <div className="entidad-acciones">
                  <Insignia tono={cliente.activo ? 'verde' : 'neutro'}>
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </Insignia>
                  {cliente.activo && (
                    <AccionDesactivar tipo="clientes" id={cliente.id} nombre={cliente.nombre} />
                  )}
                </div>
                <div className="cliente-reservas">
                  <h4>Reservas</h4>
                  {cliente.reservas.length === 0 ? (
                    <p className="cliente-sin-reservas">Sin reservas registradas.</p>
                  ) : (
                    <div className="tabla-contenedor">
                      <table className="tabla-reservas">
                        <caption>Reservas de {cliente.nombre}</caption>
                        <thead>
                          <tr>
                            <th scope="col">Fecha</th>
                            <th scope="col">Cancha</th>
                            <th scope="col">Horario</th>
                            <th scope="col">Total</th>
                            <th scope="col">Anticipo requerido</th>
                            <th scope="col">Abonado</th>
                            <th scope="col">Estado de pago</th>
                            <th scope="col">Reserva</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cliente.reservas.map((reserva) => (
                            <tr key={reserva.id}>
                              <td>{formatearFecha(reserva.fecha)}</td>
                              <td>{reserva.canchaNombre}</td>
                              <td>{formatearHora(reserva.horaInicio)}–{formatearHora(reserva.horaFin)}</td>
                              <td>{formatearPesos(reserva.valorTotal)}</td>
                              <td>{reserva.anticipoRequerido === null ? '—' : formatearPesos(reserva.anticipoRequerido)}</td>
                              <td>
                                {formatearPesos(reserva.abonado)}
                                <span className="cliente-saldo"> · saldo {formatearPesos(reserva.saldo)}</span>
                              </td>
                              <td><InsigniaEstadoPago estado={reserva.estadoPago} /></td>
                              <td>
                                <Insignia tono={reserva.estado === 'activa' ? 'verde' : 'neutro'}>
                                  {reserva.estado === 'activa' ? 'Activa' : 'Cancelada'}
                                </Insignia>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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