import type {
  DatosAbonoValidar,
  DatosCanchaValidar,
  DatosClienteValidar,
  DatosReservaValidar,
  DatosReservaPublicaValidar,
  FiltrosReservasValidar,
} from '@/lib/validacion/esquemas';
import type { EstadoPago } from '@/lib/reglas/pago';

export type EstadoReserva = 'activa' | 'cancelada';
export type DatosCancha = DatosCanchaValidar;
export type DatosCliente = DatosClienteValidar;
export type DatosReserva = DatosReservaValidar;
export type DatosReservaPublica = DatosReservaPublicaValidar;
export type DatosAbono = DatosAbonoValidar;
export type FiltrosReservas = FiltrosReservasValidar;

export type Cancha = {
  id: string;
  nombre: string;
  precioHora: number | null;
  activa: boolean;
};

export type Cliente = {
  id: string;
  nombre: string;
  contacto: string;
  email?: string | null;
  activo: boolean;
};

export type ReservaCliente = {
  id: string;
  canchaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  valorTotal: number;
  anticipoRequerido: number | null;
  abonado: number;
  saldo: number;
  estado: EstadoReserva;
  estadoPago: EstadoPago;
};

export type ClienteConReservas = Cliente & {
  reservas: ReservaCliente[];
};

export type Franja = {
  horaInicio: string;
  horaFin: string;
};

export type BloqueOcupadoPublico = Franja & {
  canchaId: string;
  fecha: string;
};

export type Reserva = {
  id: string;
  canchaId: string;
  canchaNombre: string;
  clienteId: string;
  clienteNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  valorTotal: number;
  estado: EstadoReserva;
  metodoAnticipo?: 'transferencia' | 'efectivo' | null;
  abonado: number;
  estadoPago: EstadoPago;
  saldo: number;
};

export type Abono = {
  id: number;
  reservaId: string;
  monto: number;
  fecha: string;
  createdAt: string;
};

export type Cobro = {
  total: number;
  abonado: number;
  saldo: number;
  estadoPago: EstadoPago;
  abonos: Abono[];
};

export type ReservaConCobro = Omit<Reserva, 'abonado' | 'estadoPago' | 'saldo'> & {
  cobro: Cobro;
};

export type AgendaDia = {
  fecha: string;
  canchas: Array<{
    canchaId: string;
    canchaNombre: string;
    reservas: Reserva[];
  }>;
};

export type ResumenCobros = {
  desde: string;
  hasta: string;
  totalCobrado: number;
  totalReservas: number;
  porEstado: Record<EstadoPago, number>;
};

export type ResumenAdministrador = {
  desde: string;
  hasta: string;
  totalAlquileres: number;
  alquileresActivos: number;
  ingresos: number;
  canchasAlquiladas: number;
  reservas: ReservaResumenAdministrador[];
  porCancha: Array<{
    canchaId: string;
    canchaNombre: string;
    alquileres: number;
    ingresos: number;
  }>;
};

export type ReservaResumenAdministrador = {
  id: string;
  clienteNombre: string;
  clienteContacto: string;
  clienteEmail: string | null;
  canchaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  valorTotal: number;
  anticipoRequerido: number | null;
  abonado: number;
  saldo: number;
  estado: EstadoReserva;
  estadoPago: EstadoPago;
};