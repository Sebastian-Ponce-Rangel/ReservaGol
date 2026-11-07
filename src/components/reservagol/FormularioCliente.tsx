'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';

export function FormularioCliente() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAviso(null);
    setGuardando(true);

    try {
      const respuesta = await fetch('/api/reservas/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, contacto }),
      });
      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setAviso({ tipo: 'error', texto: resultado.error?.mensaje ?? 'No se pudo crear el cliente.' });
        return;
      }

      setNombre('');
      setContacto('');
      setAviso({ tipo: 'exito', texto: 'Cliente creado.' });
      router.refresh();
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="formulario-panel" aria-labelledby="formulario-cliente-titulo">
      <div className="seccion-cabecera">
        <div>
          <p className="seccion-kicker">Administración</p>
          <h2 id="formulario-cliente-titulo">Agregar cliente</h2>
        </div>
      </div>
      <form className="formulario-en-linea" onSubmit={guardar}>
        <Campo
          etiqueta="Nombre del cliente"
          name="nombre"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          maxLength={120}
          required
        />
        <Campo
          etiqueta="Contacto"
          name="contacto"
          value={contacto}
          onChange={(evento) => setContacto(evento.target.value)}
          maxLength={120}
          required
        />
        <Boton type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Agregar cliente'}
        </Boton>
      </form>
      {aviso && <Aviso tono={aviso.tipo}>{aviso.texto}</Aviso>}
    </section>
  );
}