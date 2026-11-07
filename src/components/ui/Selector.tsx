import { useId, type SelectHTMLAttributes } from 'react';

type SelectorProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  id?: string;
  etiqueta: string;
  error?: string;
};

export function Selector({ id, etiqueta, error, className = '', children, ...props }: SelectorProps) {
  const generado = useId();
  const idCampo = id ?? generado;

  return (
    <div className="campo">
      <label htmlFor={idCampo}>{etiqueta}</label>
      <select
        id={idCampo}
        className={`campo-control ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${idCampo}-error` : undefined}
        {...props}
      >
        {children}
      </select>
      {error && <span className="campo-error" id={`${idCampo}-error`}>{error}</span>}
    </div>
  );
}