import type {
  DatosAbonoValidar,
  DatosCanchaValidar,
  DatosClienteValidar,
  DatosReservaValidar,
  FiltrosReservasValidar,
} from '@/lib/validacion/esquemas';
import type { EstadoPago } from '@/lib/reglas/pago';

export type EstadoReserva = 'activa' | 'cancelada';
export type DatosCancha = DatosCanchaValidar;
export type DatosCliente = DatosClienteValidar;
export type DatosReserva = DatosReservaValidar;
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
  activo: boolean;
};

export type Franja = {
  horaInicio: string;
  horaFin: string;
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