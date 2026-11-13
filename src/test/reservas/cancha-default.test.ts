import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearCancha } from '@/lib/datos/canchas';
import { PRECIO_HORA_BASE } from '@/lib/config/reservagol';

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock('@/lib/db/conexion', () => ({ consultar }));

describe('tarifa por defecto de cancha', () => {
  beforeEach(() => {
    consultar.mockReset().mockResolvedValue([{ id: 'cancha-nueva' }]);
  });

  it('guarda la tarifa base cuando la cancha se crea sin precio específico', async () => {
    await crearCancha({ nombre: 'Cancha Nueva' });

    expect(consultar).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO canchas'),
      ['Cancha Nueva', PRECIO_HORA_BASE],
    );
    expect(PRECIO_HORA_BASE).toBe(60000);
  });
});