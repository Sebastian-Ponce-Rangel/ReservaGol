'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ActualizarDatosEnVivo() {
  const router = useRouter();

  useEffect(() => {
    const intervalo = window.setInterval(() => router.refresh(), 5000);
    return () => window.clearInterval(intervalo);
  }, [router]);

  return null;
}
