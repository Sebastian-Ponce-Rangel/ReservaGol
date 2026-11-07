import {
  cerrarPool,
  crearCancha,
  crearCliente,
  crearReserva,
  limpiarDatosDemo,
  obtenerReserva,
  registrarAbono,
} from '@/lib/dataService';
import { hoyBogota } from '@/lib/reglas/fechas';

function fechaFutura(dias: number): string {
  const partes = hoyBogota().split('-');
  const fecha = new Date(
    Date.UTC(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]) + dias),
  );
  return fecha.toISOString().slice(0, 10);
}

async function cargarDemo(): Promise<void> {
  await limpiarDatosDemo();

  const canchaCentral = await crearCancha({ nombre: 'Demo Cancha Central' });
  const canchaNorte = await crearCancha({ nombre: 'Demo Cancha Norte' });
  const clienteUno = await crearCliente({ nombre: 'Demo Cliente Uno', contacto: '3001000001' });
  const clienteDos = await crearCliente({ nombre: 'Demo Cliente Dos', contacto: '3001000002' });
  const clienteTres = await crearCliente({ nombre: 'Demo Cliente Tres', contacto: '3001000003' });

  const reservaPendiente = await crearReserva({
    canchaId: canchaCentral.id,
    clienteId: clienteUno.id,
    fecha: fechaFutura(1),
    horaInicio: '18:00',
    horaFin: '19:00',
    valorTotal: 50000,
  });
  const reservaAnticipo = await crearReserva({
    canchaId: canchaCentral.id,
    clienteId: clienteDos.id,
    fecha: fechaFutura(2),
    horaInicio: '18:00',
    horaFin: '19:00',
    valorTotal: 50000,
  });
  const reservaPagada = await crearReserva({
    canchaId: canchaNorte.id,
    clienteId: clienteTres.id,
    fecha: fechaFutura(3),
    horaInicio: '18:00',
    horaFin: '19:00',
    valorTotal: 50000,
  });

  await registrarAbono(reservaAnticipo.id, 20000);
  await registrarAbono(reservaPagada.id, 50000);

  const filas = await Promise.all(
    [reservaPendiente, reservaAnticipo, reservaPagada].map(async (reserva) => {
      const actual = await obtenerReserva(reserva.id);
      return {
        Cancha: actual.canchaNombre,
        Cliente: actual.clienteNombre,
        Fecha: actual.fecha,
        Estado: actual.cobro.estadoPago,
        Total: actual.cobro.total,
        Abonado: actual.cobro.abonado,
      };
    }),
  );

  console.table(filas);
}

try {
  await cargarDemo();
} catch (error) {
  const codigo =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : 'error sin código';
  console.error('Falló db:demo:', codigo);
  process.exitCode = 1;
  await limpiarDatosDemo().catch(() => {});
} finally {
  await cerrarPool().catch(() => {});
}