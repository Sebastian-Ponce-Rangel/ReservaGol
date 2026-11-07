import type { EstadoPago } from '@/lib/reglas/pago';
import { Insignia } from '@/components/ui/Insignia';

type Props = {
  estado: EstadoPago;
};

const ETIQUETAS: Record<EstadoPago, string> = {
  pendiente: 'Pendiente',
  anticipo: 'Anticipo',
  pagado: 'Pagado',
};

const TONOS: Record<EstadoPago, 'rojo' | 'amarillo' | 'verde'> = {
  pendiente: 'rojo',
  anticipo: 'amarillo',
  pagado: 'verde',
};

export function InsigniaEstadoPago({ estado }: Props) {
  return <Insignia tono={TONOS[estado]}>{ETIQUETAS[estado]}</Insignia>;
}