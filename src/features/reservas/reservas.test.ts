import { describe, expect, it } from 'vitest';
import { reservas } from '@/data/reservas';

describe('reservas seed data', () => {
  it('should expose at least one reservation', () => {
    expect(reservas.length).toBeGreaterThan(0);
  });
});
