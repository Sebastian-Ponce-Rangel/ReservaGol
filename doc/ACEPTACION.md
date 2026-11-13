# Aceptación de ReservaGol

Ejecutar A-01 a A-14 en el despliegue de Vercel y registrar el resultado observado. A-15 corresponde a la funcionalidad opcional P09.

| ID | Acción | Resultado esperado | Resultado obtenido | Evidencia | Observación |
|---|---|---|---|---|---|
| A-01 | Abrir `/reservas` sin sesión | Redirección al login | | | |
| A-02 | Crear la cancha “Cancha 1” | Aparece en Canchas | | | |
| A-03 | Crear el cliente “Juan” con su contacto | Aparece en Clientes | | | |
| A-04 | Crear una reserva: Cancha 1, Juan, mañana, 18:00–19:00, $50.000 | Reserva activa, pago pendiente | | | |
| A-05 | Intentar otra reserva que solape (18:30–19:30) | Rechazo por choque de horario | | | |
| A-06 | Crear una reserva consecutiva (19:00–20:00) | Se permite | | | |
| A-07 | Intentar reservar en una fecha pasada | Rechazo con mensaje | | | |
| A-08 | Consultar la agenda de Cancha 1 para mañana | Muestra las dos franjas ocupadas y los huecos libres | | | |
| A-09 | Registrar un abono de $20.000 en la reserva | Estado pasa a Anticipo; saldo $30.000 | | | |
| A-10 | Intentar un abono de $40.000 (excede) | Rechazo | | | |
| A-11 | Registrar un abono de $30.000 | Estado pasa a Pagado; saldo $0 | | | |
| A-12 | Cancelar la reserva consecutiva | Queda cancelada; su franja se libera | | | |
| A-13 | Reservar de nuevo esa franja liberada | Se permite | | | |
| A-14 | Cerrar el navegador y volver a entrar | Los datos persisten | | | |
| A-15 | (Opcional) Ver el resumen de cobros del período con reservas reales | Total cobrado igual a la suma de abonos persistidos y conteos por estado correctos | Pendiente de comprobación visual; la base quedó sin datos de prueba. | `/reservas/resumen?fecha=2026-11-08&desde=2026-11-01&hasta=2026-11-30`; verificación automatizada de la ruta y agregados en pruebas. | No usar datos Demo como evidencia de producción. Para aceptar manualmente, registrar reservas y abonos reales; la aceptación en Vercel sigue pendiente. |

A-15 se completa después de P09. Las verificaciones automatizadas locales se documentan en `doc/checkpoints/`; no sustituyen la ejecución de aceptación en Vercel.