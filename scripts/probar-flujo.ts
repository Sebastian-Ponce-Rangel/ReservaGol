import {
  cancelarReserva,
  cerrarPool,
  crearCancha,
  crearCliente,
  crearReserva,
  disponibilidad,
  limpiarDatosPrueba,
  registrarAbono,
} from '@/lib/dataService';
import { hoyBogota } from '@/lib/reglas/fechas';
import { ErrorDeNegocio, type CodigoError } from '@/lib/reglas/errores';

let fallas = 0;

function resultado(ok: boolean, mensaje: string): void {
  console.log(`${ok ? 'OK' : 'FALLA'} ${mensaje}`);
  if (!ok) fallas += 1;
}

async function paso<T>(mensaje: string, accion: () => Promise<T>): Promise<T> {
  try {
    const valor = await accion();
    resultado(true, mensaje);
    return valor;
  } catch (error) {
    resultado(false, `${mensaje} (${error instanceof ErrorDeNegocio ? error.codigo : 'error'})`);
    throw error;
  }
}

async function esperarError(
  mensaje: string,
  codigo: CodigoError,
  accion: () => Promise<unknown>,
): Promise<void> {
  let capturado: unknown;
  try {
    await accion();
  } catch (error) {
    capturado = error;
  }

  const coincide = capturado instanceof ErrorDeNegocio && capturado.codigo === codigo;
  resultado(coincide, `${mensaje}: esperado ${codigo}`);
  if (!coincide) throw new Error(`El paso no produjo ${codigo}.`);
}

function fechaRelativa(dias: number): string {
  const partes = hoyBogota().split('-');
  return new Date(
    Date.UTC(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]) + dias),
  ).toISOString().slice(0, 10);
}

async function ejecutarFlujo(): Promise<void> {
  const cancha = await paso('1) crear cancha Prueba Cancha 1', () =>
    crearCancha({ nombre: 'Prueba Cancha 1' }),
  );

  await esperarError('2) rechazar nombre duplicado', 'CANCHA_DUPLICADA', () =>
    crearCancha({ nombre: 'prueba cancha 1' }),
  );

  const cliente = await paso('3) crear cliente Prueba Cliente', () =>
    crearCliente({ nombre: 'Prueba Cliente', contacto: '300' }),
  );
  const fecha = fechaRelativa(3);

  const primera = await paso('4) crear reserva activa 18:00-19:00', () =>
    crearReserva({
      canchaId: cancha.id,
      clienteId: cliente.id,
      fecha,
      horaInicio: '18:00',
      horaFin: '19:00',
      valorTotal: 50000,
    }),
  );

  await esperarError('5) rechazar solape parcial', 'CHOQUE_HORARIO', () =>
    crearReserva({
      canchaId: cancha.id,
      clienteId: cliente.id,
      fecha,
      horaInicio: '18:30',
      horaFin: '19:30',
      valorTotal: 50000,
    }),
  );

  const consecutiva = await paso('6) permitir franja consecutiva 19:00-20:00', () =>
    crearReserva({
      canchaId: cancha.id,
      clienteId: cliente.id,
      fecha,
      horaInicio: '19:00',
      horaFin: '20:00',
      valorTotal: 50000,
    }),
  );

  await esperarError('7) rechazar fecha pasada', 'FECHA_INVALIDA', () =>
    crearReserva({
      canchaId: cancha.id,
      clienteId: cliente.id,
      fecha: fechaRelativa(-1),
      horaInicio: '20:00',
      horaFin: '21:00',
      valorTotal: 50000,
    }),
  );

  await esperarError('8) rechazar hora fin anterior', 'DATOS_INVALIDOS', () =>
    crearReserva({
      canchaId: cancha.id,
      clienteId: cliente.id,
      fecha,
      horaInicio: '19:00',
      horaFin: '18:00',
      valorTotal: 50000,
    }),
  );

  await paso('9) disponibilidad contiene dos franjas', async () => {
    const resultadoDisponibilidad = await disponibilidad(cancha.id, fecha);
    if (resultadoDisponibilidad.ocupadas.length !== 2) {
      throw new Error('Se esperaban dos franjas ocupadas.');
    }
  });

  await paso('10) registrar anticipo de 20000 y saldo de 30000', async () => {
    const cobro = await registrarAbono(primera.id, 20000);
    if (cobro.estadoPago !== 'anticipo' || cobro.saldo !== 30000) {
      throw new Error('El cobro no quedó en anticipo con saldo 30000.');
    }
  });

  await esperarError('11) rechazar abono que excede el total', 'ABONO_EXCEDE_TOTAL', () =>
    registrarAbono(primera.id, 40000),
  );

  await paso('12) completar el pago y dejar saldo cero', async () => {
    const cobro = await registrarAbono(primera.id, 30000);
    if (cobro.estadoPago !== 'pagado' || cobro.saldo !== 0) {
      throw new Error('El cobro no quedó pagado.');
    }
  });

  await paso('13) cancelar la reserva consecutiva', async () => {
    const reserva = await cancelarReserva(consecutiva.id);
    if (reserva.estado !== 'cancelada') throw new Error('La reserva no quedó cancelada.');
  });

  await paso('14) volver a reservar la franja liberada', () =>
    crearReserva({
      canchaId: cancha.id,
      clienteId: cliente.id,
      fecha,
      horaInicio: '19:00',
      horaFin: '20:00',
      valorTotal: 50000,
    }),
  );

  await esperarError('15) rechazar abono en reserva cancelada', 'RESERVA_CANCELADA', () =>
    registrarAbono(consecutiva.id, 1000),
  );
}

async function main(): Promise<void> {
  try {
    await limpiarDatosPrueba();
    await ejecutarFlujo();
  } catch (error) {
    fallas = Math.max(fallas, 1);
    if (!(error instanceof ErrorDeNegocio)) {
      console.error('FALLA flujo:', error instanceof Error ? error.message : 'error');
    }
  } finally {
    try {
      await limpiarDatosPrueba();
    } catch (error) {
      resultado(false, `limpieza final (${error instanceof ErrorDeNegocio ? error.codigo : 'error'})`);
    }
    await cerrarPool().catch(() => {});
  }

  console.log(`Total de fallas: ${fallas}`);
  if (fallas > 0) process.exitCode = 1;
}

await main();