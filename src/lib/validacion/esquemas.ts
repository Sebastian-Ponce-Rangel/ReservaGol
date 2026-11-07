import { z } from 'zod';
import { esFechaValida, esHoraValida } from '@/lib/reglas/fechas';

const esquemaFecha = z.string().refine(esFechaValida, 'Fecha inválida.');
const esquemaHora = z.string().refine(esHoraValida, 'La hora debe tener formato HH:MM.');

export const esquemaCancha = z.object({
  nombre: z.string().trim().min(1).max(100),
  precioHora: z.number().int().min(1).optional(),
});

export const esquemaCliente = z.object({
  nombre: z.string().trim().min(1).max(120),
  contacto: z.string().trim().min(1).max(120),
});

export const esquemaReserva = z.object({
  canchaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  fecha: esquemaFecha,
  horaInicio: esquemaHora,
  horaFin: esquemaHora,
  valorTotal: z.number().int().min(1),
});

export const esquemaAbono = z.object({
  monto: z.number().int().min(1),
});

export const esquemaDisponibilidad = z.object({
  canchaId: z.string().uuid(),
  fecha: esquemaFecha,
});

export const esquemaFiltrosReservas = z.object({
  canchaId: z.string().uuid().optional(),
  fecha: esquemaFecha.optional(),
  estado: z.enum(['activa', 'cancelada']).optional(),
});

export const esquemaLogin = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type DatosCanchaValidar = z.infer<typeof esquemaCancha>;
export type DatosClienteValidar = z.infer<typeof esquemaCliente>;
export type DatosReservaValidar = z.infer<typeof esquemaReserva>;
export type DatosAbonoValidar = z.infer<typeof esquemaAbono>;
export type DatosDisponibilidadValidar = z.infer<typeof esquemaDisponibilidad>;
export type FiltrosReservasValidar = z.infer<typeof esquemaFiltrosReservas>;
export type DatosLoginValidar = z.infer<typeof esquemaLogin>;