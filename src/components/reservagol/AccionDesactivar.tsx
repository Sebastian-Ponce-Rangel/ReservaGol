'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Modal } from '@/components/ui/Modal';

type AccionDesactivarProps = {
  tipo: 'canchas' | 'clientes';
  id: string;
  nombre: string;
};

export function AccionDesactivar({ tipo, id, nombre }: AccionDesactivarProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  async function desactivar() {
    setOcupado(true);
    setError('');
    try {
      const respuesta = await fetch(`/api/reservas/${tipo}/${id}/desactivar`, { method: 'POST' });
      const resultado = await respuesta.json();
      if (!respuesta.ok) {
        setError(resultado.error?.mensaje ?? 'No se pudo desactivar.');
        return;
      }
      setAbierto(false);
      router.refresh();
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <Boton variante="secundario" type="button" onClick={() => setAbierto(true)}>
        Desactivar
      </Boton>
      <Modal
        abierto={abierto}
        titulo="Confirmar desactivación"
        confirmar="Desactivar"
        alCerrar={() => setAbierto(false)}
        alConfirmar={desactivar}
        ocupado={ocupado}
      >
        <p>¿Desactivar {nombre}? Se conservará en el historial.</p>
        {error && <Aviso tono="error">{error}</Aviso>}
      </Modal>
    </>
  );
}