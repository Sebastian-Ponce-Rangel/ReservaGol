export type CodigoError =
  | 'DATOS_INVALIDOS'
  | 'NO_AUTORIZADO'
  | 'CANCHA_DUPLICADA'
  | 'CANCHA_NO_ENCONTRADA'
  | 'CLIENTE_NO_ENCONTRADO'
  | 'RESERVA_NO_ENCONTRADA'
  | 'CHOQUE_HORARIO'
  | 'FECHA_INVALIDA'
  | 'RESERVA_CANCELADA'
  | 'ABONO_EXCEDE_TOTAL'
  | 'TIENE_DEPENDENCIAS'
  | 'ERROR_INTERNO';

export const MENSAJES: Record<CodigoError, string> = {
  DATOS_INVALIDOS: 'Revise los datos ingresados.',
  NO_AUTORIZADO: 'Debe iniciar sesión.',
  CANCHA_DUPLICADA: 'Ya existe una cancha con ese nombre.',
  CANCHA_NO_ENCONTRADA: 'La cancha no existe.',
  CLIENTE_NO_ENCONTRADO: 'El cliente no existe.',
  RESERVA_NO_ENCONTRADA: 'La reserva no existe.',
  CHOQUE_HORARIO: 'Esa cancha ya está reservada en ese horario.',
  FECHA_INVALIDA: 'No se puede reservar en una fecha pasada.',
  RESERVA_CANCELADA: 'La reserva está cancelada.',
  ABONO_EXCEDE_TOTAL: 'El abono supera el saldo pendiente de la reserva.',
  TIENE_DEPENDENCIAS: 'No se puede eliminar: tiene reservas asociadas.',
  ERROR_INTERNO: 'Ocurrió un error inesperado. Intente de nuevo.',
};

export const ESTADO_HTTP: Record<CodigoError, number> = {
  DATOS_INVALIDOS: 400,
  NO_AUTORIZADO: 401,
  CANCHA_DUPLICADA: 409,
  CANCHA_NO_ENCONTRADA: 404,
  CLIENTE_NO_ENCONTRADO: 404,
  RESERVA_NO_ENCONTRADA: 404,
  CHOQUE_HORARIO: 409,
  FECHA_INVALIDA: 422,
  RESERVA_CANCELADA: 409,
  ABONO_EXCEDE_TOTAL: 409,
  TIENE_DEPENDENCIAS: 409,
  ERROR_INTERNO: 500,
};

export class ErrorDeNegocio extends Error {
  readonly codigo: CodigoError;
  readonly detalles?: unknown;

  constructor(codigo: CodigoError, mensaje?: string, detalles?: unknown) {
    super(mensaje ?? MENSAJES[codigo]);
    this.name = 'ErrorDeNegocio';
    this.codigo = codigo;
    this.detalles = detalles;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}