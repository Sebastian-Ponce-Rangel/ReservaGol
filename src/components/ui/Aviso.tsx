import type { HTMLAttributes } from 'react';

type AvisoProps = HTMLAttributes<HTMLParagraphElement> & {
  tono?: 'exito' | 'error' | 'informacion';
};

export function Aviso({ tono = 'informacion', className = '', ...props }: AvisoProps) {
  return (
    <p
      className={`aviso aviso--${tono} ${className}`.trim()}
      role={tono === 'error' ? 'alert' : 'status'}
      {...props}
    />
  );
}