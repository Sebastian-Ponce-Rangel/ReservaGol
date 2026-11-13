import { describe, expect, it } from 'vitest';
import { esquemaReserva } from '@/lib/validacion/esquemas';

const BASE = {
  canchaId: '98b5f05a-7f6d-4c35-96a1-e338d770c09a',
  fecha: '2026-11-20',
  horaInicio: '18:00',
  horaFin: '19:00',
  valorTotal: 50000,
};

describe('esquemaReserva con datos de anticipo', () => {
  it('mantiene compatible el flujo legado con un cliente existente', () => {
    expect(esquemaReserva.parse({
      ...BASE,
      clienteId: 'f53851d6-b065-4f4f-865c-2aa8604c0a3e',
    }).clienteId).toBe('f53851d6-b065-4f4f-865c-2aa8604c0a3e');
  });

  it('acepta cliente nuevo, método y aceptación de privacidad', () => {
    const datos = esquemaReserva.parse({
      ...BASE,
      clienteNuevo: { nombre: 'Ana Prueba', contacto: '3001234567', email: 'ana@example.com' },
      metodoAnticipo: 'transferencia',
      politicasAceptadas: true,
    });

    expect(datos.clienteNuevo?.email).toBe('ana@example.com');
  });

  it('rechaza cliente nuevo sin correo válido o consentimiento', () => {
    expect(esquemaReserva.safeParse({
      ...BASE,
      clienteNuevo: { nombre: 'Ana Prueba', contacto: '3001234567', email: 'no-es-correo' },
      metodoAnticipo: 'transferencia',
      politicasAceptadas: true,
    }).success).toBe(false);

    expect(esquemaReserva.safeParse({
      ...BASE,
      clienteNuevo: { nombre: 'Ana Prueba', contacto: '3001234567', email: 'ana@example.com' },
      metodoAnticipo: 'transferencia',
      politicasAceptadas: false,
    }).success).toBe(false);
  });
});