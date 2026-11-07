import type { HTMLAttributes } from 'react';

type InsigniaProps = HTMLAttributes<HTMLSpanElement> & {
  tono?: 'verde' | 'rojo' | 'amarillo' | 'neutro';
};

export function Insignia({ tono = 'neutro', className = '', ...props }: InsigniaProps) {
  return <span className={`insignia insignia--${tono} ${className}`.trim()} {...props} />;
}