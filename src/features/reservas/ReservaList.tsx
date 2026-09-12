import { reservas } from '@/data/reservas';

export function ReservaList() {
  return (
    <section className="reserva-list">
      <h2>Reservas</h2>
      <ul>
        {reservas.map((reserva) => (
          <li key={reserva.id}>
            <span>{reserva.cancha}</span>
            <span>{reserva.fecha}</span>
            <span>{reserva.estado}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
