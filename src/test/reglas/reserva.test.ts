import { describe, expect, it } from 'vitest';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esFechaValida, hoyBogota } from '@/lib/reglas/fechas';
import { validarCliente } from '@/lib/reglas/cliente';
import { validarReserva } from '@/lib/reglas/reserva';
import { esperarCodigo } from './ayudas';

const HOY = '2026-06-15';

describe('reglas de reserva y cliente', () => {
  it('T-19: rechaza una fecha pasada', () => {
    esperarCodigo(
      () =>
        validarReserva(
          { fecha: '2026-06-14', horaInicio: '18:00', horaFin: '19:00', valorTotal: 50000 },
          HOY,
        ),
      'FECHA_INVALIDA',
    );
  });

  it('T-20: rechaza una franja cuyo fin no es posterior', () => {
    esperarCodigo(
      () =>
        validarReserva(
          { fecha: HOY, horaInicio: '18:00', horaFin: '18:00', valorTotal: 50000 },
          HOY,
        ),
      'DATOS_INVALIDOS',
    );
    esperarCodigo(
      () =>
        validarReserva(
          { fecha: HOY, horaInicio: '19:00', horaFin: '18:00', valorTotal: 50000 },
          HOY,
        ),
      'DATOS_INVALIDOS',
    );
  });

  it('T-21: rechaza un valor total de cero', () => {
    esperarCodigo(
      () =>
        validarReserva(
          { fecha: HOY, horaInicio: '18:00', horaFin: '19:00', valorTotal: 0 },
          HOY,
        ),
      'DATOS_INVALIDOS',
    );
  });

  it('T-22: acepta una reserva futura válida y calcula hoy en Bogotá', () => {
    expect(esFechaValida('2026-06-18')).toBe(true);
    expect(esFechaValida('2026-02-30')).toBe(false);
    expect(hoyBogota(new Date('2026-06-15T04:30:00.000Z'))).toBe('2026-06-14');
    expect(() =>
      validarReserva(
        { fecha: '2026-06-18', horaInicio: '18:00', horaFin: '19:00', valorTotal: 50000 },
        HOY,
      ),
    ).not.toThrow();
  });

  it('T-24: rechaza un nombre de cliente vacío', () => {
    expect(() => validarCliente({ nombre: ' ', contacto: '300' })).toThrowError(
      ErrorDeNegocio,
    );
    esperarCodigo(() => validarCliente({ nombre: ' ', contacto: '300' }), 'DATOS_INVALIDOS');
  });

  it('T-25: rechaza un contacto vacío', () => {
    esperarCodigo(() => validarCliente({ nombre: 'Juan', contacto: ' ' }), 'DATOS_INVALIDOS');
  });
});