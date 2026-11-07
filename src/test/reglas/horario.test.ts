import { describe, expect, it } from 'vitest';
import { esHoraValida } from '@/lib/reglas/fechas';
import { finPosteriorAInicio, haySolape } from '@/lib/reglas/horario';

describe('reglas de horario', () => {
  it('T-01: detecta franjas idénticas', () => {
    expect(haySolape('18:00', '19:00', '18:00', '19:00')).toBe(true);
  });

  it('T-02: detecta solape parcial', () => {
    expect(haySolape('18:00', '19:00', '18:30', '19:30')).toBe(true);
  });

  it('T-03: detecta una franja contenida', () => {
    expect(haySolape('18:00', '20:00', '18:30', '19:00')).toBe(true);
  });

  it('T-04: permite franjas consecutivas', () => {
    expect(haySolape('18:00', '19:00', '19:00', '20:00')).toBe(false);
  });

  it('T-05: permite franjas separadas', () => {
    expect(haySolape('18:00', '19:00', '20:00', '21:00')).toBe(false);
  });

  it('T-06: permite una franja que termina al inicio de otra', () => {
    expect(haySolape('18:00', '19:00', '17:00', '18:00')).toBe(false);
  });

  it('T-07: acepta una hora de fin posterior', () => {
    expect(finPosteriorAInicio('18:00', '19:00')).toBe(true);
  });

  it('T-08: rechaza una hora de fin anterior', () => {
    expect(finPosteriorAInicio('19:00', '18:00')).toBe(false);
  });

  it('T-09: rechaza horas de inicio y fin iguales', () => {
    expect(finPosteriorAInicio('18:00', '18:00')).toBe(false);
  });

  it('T-23: rechaza horas fuera del rango válido', () => {
    expect(esHoraValida('25:00')).toBe(false);
    expect(esHoraValida('18:60')).toBe(false);
  });
});