import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActualizarDatosEnVivo } from '@/components/reservagol/ActualizarDatosEnVivo';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

describe('ActualizarDatosEnVivo', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('refresca los datos del servidor periódicamente', async () => {
    refresh.mockClear();
    vi.useFakeTimers();
    render(<ActualizarDatosEnVivo />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(refresh).toHaveBeenCalledOnce();
  });
});
