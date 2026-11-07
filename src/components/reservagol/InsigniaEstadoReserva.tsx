import type { EstadoReserva } from '@/lib/datos/tipos';
import { Insignia } from '@/components/ui/Insignia';

type Props = {
  estado: EstadoReserva;
};

export function InsigniaEstadoReserva({ estado }: Props) {
  return (
    <Insignia tono={estado === 'activa' ? 'verde' : 'neutro'}>
      {estado === 'activa' ? 'Activa' : 'Cancelada'}
    </Insignia>
  );
}