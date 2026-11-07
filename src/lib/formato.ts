import { esFechaValida } from '@/lib/reglas/fechas';

const FORMATO_PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatearPesos(monto: number): string {
  return FORMATO_PESOS.format(monto);
}

export function formatearFecha(fecha: string): string {
  if (!esFechaValida(fecha)) return fecha;
  return FORMATO_FECHA.format(new Date(`${fecha}T12:00:00.000Z`));
}

export function formatearHora(hora: string): string {
  return hora.slice(0, 5);
}