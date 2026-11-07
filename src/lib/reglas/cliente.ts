import { ErrorDeNegocio } from '@/lib/reglas/errores';

type DatosClienteValidar = {
  nombre: string;
  contacto: string;
};

export function validarCliente(d: DatosClienteValidar): void {
  if (!d.nombre.trim() || !d.contacto.trim()) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}