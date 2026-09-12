export type Reserva = {
  id: string;
  cancha: string;
  fecha: string;
  estado: 'disponible' | 'confirmada' | 'pendiente';
};

export const reservas: Reserva[] = [
  { id: 'R-001', cancha: 'Cancha Central', fecha: '2026-09-12', estado: 'disponible' },
  { id: 'R-002', cancha: 'Cancha Norte', fecha: '2026-09-13', estado: 'confirmada' },
];
