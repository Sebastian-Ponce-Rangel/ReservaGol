import { ZONA_HORARIA } from '@/lib/config/reservagol';

export function hoyBogota(reloj: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(reloj);
  const anio = partes.find((parte) => parte.type === 'year')?.value;
  const mes = partes.find((parte) => parte.type === 'month')?.value;
  const dia = partes.find((parte) => parte.type === 'day')?.value;

  if (!anio || !mes || !dia) {
    throw new Error('No fue posible calcular la fecha de Bogotá.');
  }

  return `${anio}-${mes}-${dia}`;
}

export function esFechaValida(fecha: string): boolean {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!coincidencia) return false;

  const [, anioTexto, mesTexto, diaTexto] = coincidencia;
  if (!anioTexto || !mesTexto || !diaTexto) return false;

  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);
  if (anio < 1 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;

  const bisiesto = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
  const diasPorMes = [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return dia <= (diasPorMes[mes - 1] ?? 0);
}

export function esHoraValida(hora: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

export function esFechaPasada(fecha: string, hoy: string): boolean {
  return fecha < hoy;
}