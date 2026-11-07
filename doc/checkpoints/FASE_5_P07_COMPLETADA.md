# P07 completado · Agenda y creación de reservas

P07 entrega consulta de disponibilidad y alta de reserva en la UI. La fase 5 sigue abierta hasta P08.

## Agenda

- Selector GET de cancha/fecha; hoy por defecto con `hoyBogota()`.
- Lista las reservas activas de la cancha/día con cliente, franja y estado de pago.
- Calcula y muestra las franjas libres dentro del horario 06:00–23:00.
- Tiene acceso directo a la creación con cancha/fecha preseleccionadas.

## Nueva reserva

- Selección de cancha y cliente activos; fecha, inicio, fin y valor entero.
- Validación en vivo: fecha válida/no pasada, fin posterior al inicio y total positivo.
- Usa `POST /api/reservas`; los solapes muestran cancha y franja conflictiva y las franjas consecutivas se aceptan.
- Al guardar, vuelve a la agenda filtrada por cancha y fecha.

## Smoke funcional

Prueba real en Next dev contra la base con fixture `Prueba P07`:

- Crear reserva 18:00–19:00: correcta y visible en agenda.
- Intentar 18:30–19:30: rechazado con “Prueba P07 Cancha ya tiene una reserva de 18:00 a 19:00 ese día. Elige otro horario.”
- Crear 19:00–20:00: permitido; el hueco mostrado pasa a 20:00–23:00.
- Fecha pasada, fin igual al inicio y valor 0: mensajes de validación visibles.
- Fixture de prueba eliminado; Demo permanece.
- Viewport 390 px: `documentWidth` 375 px, sin overflow horizontal.

## Verificaciones

- `npm.cmd test`: 42 pruebas pasaron.
- `npm.cmd run build`: exitoso con Next.js 16.3.5.