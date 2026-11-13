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
  email: z.string().trim().email().max(254).optional(),
});

const esquemaClienteNuevoReserva = esquemaCliente.extend({
  email: z.string().trim().email().max(254),
});

export const esquemaReserva = z.object({
  canchaId: z.string().uuid(),
  clienteId: z.string().uuid().optional(),
  clienteNuevo: esquemaClienteNuevoReserva.optional(),
  fecha: esquemaFecha,
  horaInicio: esquemaHora,
  horaFin: esquemaHora,
  valorTotal: z.number().int().min(1),
  metodoAnticipo: z.enum(['transferencia', 'efectivo']).optional(),
  politicasAceptadas: z.literal(true).optional(),
}).superRefine((datos, contexto) => {
  if (Boolean(datos.clienteId) === Boolean(datos.clienteNuevo)) {
    contexto.addIssue({
      code: 'custom',
      path: ['clienteId'],
      message: 'Selecciona un cliente existente o ingresa uno nuevo.',
    });
  }

  if (datos.clienteNuevo && !datos.metodoAnticipo) {
    contexto.addIssue({
      code: 'custom',
      path: ['metodoAnticipo'],
      message: 'Selecciona el método para pagar el anticipo.',
    });
  }

  if (datos.metodoAnticipo && datos.politicasAceptadas !== true) {
    contexto.addIssue({
      code: 'custom',
      path: ['politicasAceptadas'],
      message: 'Debes aceptar las políticas de privacidad.',
    });
  }
});

export const esquemaReservaPublica = z.object({
  canchaId: z.string().uuid(),
  clienteNuevo: z.object({
    nombre: z.string().trim().min(1).max(120),
    contacto: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
  }),
  fecha: esquemaFecha,
  horaInicio: esquemaHora,
  horaFin: esquemaHora,
  metodoAnticipo: z.enum(['transferencia', 'efectivo']),
  politicasAceptadas: z.literal(true),
}).refine(({ horaInicio, horaFin }) =>
  horaInicio.endsWith(':00') && horaFin.endsWith(':00'), {
  path: ['horaInicio'],
  message: 'Las reservas públicas se hacen por horas completas.',
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

export const esquemaRangoResumen = z.object({
  desde: esquemaFecha,
  hasta: esquemaFecha,
}).refine(({ desde, hasta }) => desde <= hasta, {
  path: ['hasta'],
  message: 'La fecha final debe ser igual o posterior a la inicial.',
});

export const esquemaLogin = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type DatosCanchaValidar = z.infer<typeof esquemaCancha>;
export type DatosClienteValidar = z.infer<typeof esquemaCliente>;
export type DatosReservaValidar = z.infer<typeof esquemaReserva>;
export type DatosReservaPublicaValidar = z.infer<typeof esquemaReservaPublica>;
export type DatosAbonoValidar = z.infer<typeof esquemaAbono>;
export type DatosDisponibilidadValidar = z.infer<typeof esquemaDisponibilidad>;
export type FiltrosReservasValidar = z.infer<typeof esquemaFiltrosReservas>;
export type DatosLoginValidar = z.infer<typeof esquemaLogin>;