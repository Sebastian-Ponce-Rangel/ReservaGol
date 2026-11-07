import { useId, type InputHTMLAttributes } from 'react';

type CampoProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id?: string;
  etiqueta: string;
  error?: string | undefined;
};

export function Campo({ id, etiqueta, error, className = '', ...props }: CampoProps) {
  const generado = useId();
  const idCampo = id ?? generado;

  return (
    <div className="campo">
      <label htmlFor={idCampo}>{etiqueta}</label>
      <input
        id={idCampo}
        className={`campo-control ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${idCampo}-error` : undefined}
        {...props}
      />
      {error && <span className="campo-error" id={`${idCampo}-error`}>{error}</span>}
    </div>
  );
}