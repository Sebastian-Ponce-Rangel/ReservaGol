import { useEffect, useRef, type ReactNode } from 'react';
import { Boton } from './Boton';

type ModalProps = {
  abierto: boolean;
  titulo: string;
  children: ReactNode;
  confirmar: string;
  alCerrar: () => void;
  alConfirmar: () => void;
  ocupado?: boolean;
};

export function Modal({ abierto, titulo, children, confirmar, alCerrar, alConfirmar, ocupado = false }: ModalProps) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = dialogo.current;
    if (abierto && elemento && !elemento.open) elemento.showModal();
    if (!abierto && elemento?.open) elemento.close();
    return () => {
      if (elemento?.open) elemento.close();
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <dialog
      ref={dialogo}
      className="modal"
      aria-labelledby="modal-titulo"
      aria-describedby="modal-contenido"
      onCancel={(evento) => {
        evento.preventDefault();
        if (!ocupado) alCerrar();
      }}
      onKeyDown={(evento) => {
        if (evento.key === 'Escape' && !ocupado) {
          evento.preventDefault();
          alCerrar();
        }
      }}
    >
        <h2 id="modal-titulo">{titulo}</h2>
        <div className="modal-contenido" id="modal-contenido">{children}</div>
        <div className="modal-acciones">
          <Boton variante="secundario" type="button" onClick={alCerrar} disabled={ocupado}>
            Volver
          </Boton>
          <Boton variante="peligro" type="button" onClick={alConfirmar} disabled={ocupado}>
            {ocupado ? 'Procesando...' : confirmar}
          </Boton>
        </div>
    </dialog>
  );
}