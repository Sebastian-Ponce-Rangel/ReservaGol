import type { HTMLAttributes } from 'react';

type TarjetaProps = HTMLAttributes<HTMLElement> & {
  titulo?: string;
};

export function Tarjeta({ titulo, className = '', children, ...props }: TarjetaProps) {
  return (
    <section className={`tarjeta ${className}`.trim()} {...props}>
      {titulo && <h2 className="tarjeta-titulo">{titulo}</h2>}
      {children}
    </section>
  );
}