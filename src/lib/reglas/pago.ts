export type EstadoPago = 'pendiente' | 'anticipo' | 'pagado';

export function estadoPago(total: number, abonado: number): EstadoPago {
  if (abonado <= 0) return 'pendiente';
  if (abonado >= total) return 'pagado';
  return 'anticipo';
}

export function saldo(total: number, abonado: number): number {
  return Math.max(0, total - abonado);
}

export function abonoValido(
  total: number,
  abonadoActual: number,
  monto: number,
): boolean {
  return Number.isInteger(monto) && monto > 0 && abonadoActual + monto <= total;
}