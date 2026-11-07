import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { InsigniaEstadoPago } from '@/components/reservagol/InsigniaEstadoPago';
import { formatearFecha, formatearHora, formatearPesos } from '@/lib/formato';
import type { Reserva } from '@/lib/datos/tipos';

type ReservaListProps = {
  reservas: Reserva[];
};

export function ReservaList({ reservas }: ReservaListProps) {
  if (reservas.length === 0) {
    return <EstadoVacio titulo="Sin reservas activas" detalle="Las reservas nuevas aparecerán aquí." />;
  }

  return (
    <section className="tabla-contenedor" aria-label="Reservas activas">
      <table className="tabla-reservas">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Horario</th>
            <th>Cancha</th>
            <th>Cliente</th>
            <th>Valor</th>
            <th>Pago</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((reserva) => (
            <tr key={reserva.id}>
              <td>{formatearFecha(reserva.fecha)}</td>
              <td>{formatearHora(reserva.horaInicio)}–{formatearHora(reserva.horaFin)}</td>
              <td>{reserva.canchaNombre}</td>
              <td>{reserva.clienteNombre}</td>
              <td className="monto-tabular">{formatearPesos(reserva.valorTotal)}</td>
              <td><InsigniaEstadoPago estado={reserva.estadoPago} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
