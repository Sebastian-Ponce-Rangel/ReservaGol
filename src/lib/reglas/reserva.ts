import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esFechaPasada, esFechaValida, esHoraValida } from '@/lib/reglas/fechas';
import { finPosteriorAInicio } from '@/lib/reglas/horario';

type DatosReservaValidar = {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  valorTotal: number;
};

export function validarReserva(d: DatosReservaValidar, hoy: string): void {
  if (!esFechaValida(d.fecha) || esFechaPasada(d.fecha, hoy)) {
    throw new ErrorDeNegocio('FECHA_INVALIDA');
  }

  if (
    !esHoraValida(d.horaInicio) ||
    !esHoraValida(d.horaFin) ||
    !finPosteriorAInicio(d.horaInicio, d.horaFin)
  ) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  if (!Number.isInteger(d.valorTotal) || d.valorTotal <= 0) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}