import {
  cerrarPool,
  limpiarDatosPrueba,
  limpiarDatosPruebaYDemo,
} from '../src/lib/dataService.ts';

const soloPrueba = process.argv.includes('--prueba');

try {
  const conteos = soloPrueba
    ? await limpiarDatosPrueba()
    : await limpiarDatosPruebaYDemo();
  console.log('Registros eliminados:');
  console.table([conteos]);
} catch (error) {
  console.error('Falló db:limpiar:', error.code ?? 'error sin código');
  process.exitCode = 1;
} finally {
  await cerrarPool().catch(() => {});
}