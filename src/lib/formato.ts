import { esFechaValida } from '@/lib/reglas/fechas';

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatearPesos(monto: number): string {
  const entero = Math.max(0, Math.round(monto));
  const formateado = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(entero);
  return `$${formateado} COP`;
}

export function formatearFecha(fecha: string): string {
  if (!esFechaValida(fecha)) return fecha;
  return FORMATO_FECHA.format(new Date(`${fecha}T12:00:00.000Z`));
}

export function formatearHora(hora: string): string {
  return hora.slice(0, 5);
}