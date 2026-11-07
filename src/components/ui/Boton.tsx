import type { ButtonHTMLAttributes } from 'react';

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'peligro';
};

export function Boton({ variante = 'primario', className = '', ...props }: BotonProps) {
  return (
    <button className={`boton boton--${variante} ${className}`.trim()} {...props} />
  );
}