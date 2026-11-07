'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';

export function FormularioCancha() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [precioHora, setPrecioHora] = useState('');
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAviso(null);
    setGuardando(true);

    try {
      const datos: { nombre: string; precioHora?: number } = { nombre };
      if (precioHora) datos.precioHora = Number(precioHora);
      const respuesta = await fetch('/api/reservas/canchas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setAviso({ tipo: 'error', texto: resultado.error?.mensaje ?? 'No se pudo crear la cancha.' });
        return;
      }

      setNombre('');
      setPrecioHora('');
      setAviso({ tipo: 'exito', texto: 'Cancha creada.' });
      router.refresh();
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="formulario-panel" aria-labelledby="formulario-cancha-titulo">
      <div className="seccion-cabecera">
        <div>
          <p className="seccion-kicker">Administración</p>
          <h2 id="formulario-cancha-titulo">Agregar cancha</h2>
        </div>
      </div>
      <form className="formulario-en-linea" onSubmit={guardar}>
        <Campo
          etiqueta="Nombre de la cancha"
          name="nombre"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          maxLength={100}
          required
        />
        <Campo
          etiqueta="Precio por hora (COP)"
          name="precioHora"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={precioHora}
          onChange={(evento) => setPrecioHora(evento.target.value)}
        />
        <Boton type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Agregar cancha'}
        </Boton>
      </form>
      {aviso && <Aviso tono={aviso.tipo}>{aviso.texto}</Aviso>}
    </section>
  );
}