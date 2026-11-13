# Fase 9 · Sincronización de agenda y panel de propietario

## Entregables

- La agenda pública usa un layout de cuadrícula con espaciado explícito entre el hero, los filtros y la disponibilidad; el banner ya no se superpone con los selectores.
- La reserva pública persiste cliente y reserva en una transacción, con cancha, fecha y horas seleccionadas. La agenda consulta la misma base y bloquea la franja después de confirmar.
- Contaduría y Clientes refrescan sus datos cada cinco segundos. El resumen y la lista de clientes consumen `v_reservas`, consistente con las reservas y abonos persistidos.
- La lista de Clientes muestra teléfono, correo, fecha, hora, cancha, total, anticipo requerido, abono real, saldo y estado. Los anticipos pendientes se muestran aparte y no se suman a ingresos registrados.
- Contaduría presenta las reservas recientes desde `v_reservas`, con nombre y contacto del cliente, cancha, fecha, horario, total, anticipo requerido, abonos recibidos, saldo y estados.
- Se eliminó el fixture estático antiguo de reservas que no pertenecía al flujo de la aplicación.
- A petición del usuario, se limpiaron exclusivamente registros identificados por los prefijos Demo/Prueba: 2 abonos, 3 reservas, 3 clientes y 2 canchas. La base configurada quedó vacía; no se generaron reservas ficticias para rellenar el panel.
- Contaduría muestra ahora todas las reservas recientes persistidas sin filtrar la tabla por el período de las métricas, evitando ocultar reservas programadas en el siguiente mes. Los errores del formulario se registran en consola sin registrar datos personales; la reserva confirmada continúa bloqueando la celda de inmediato.
- No se modificó la conexión de Postgres ni se añadieron migraciones.

## Verificaciones

- `npm.cmd test`: 78 pruebas pasaron en 22 archivos tras los cambios P13.
- `npm.cmd run build`: exitoso con Next.js 16.3.5.
- `npm.cmd run db:verificar`: 0 fallas; todas las tablas, vista, restricciones e integridad transaccional verificadas. Después de la limpieza, las cuatro tablas de dominio reportan cero filas.
- Lectura de solo consulta con la capa de datos actual: antes de retirar datos Demo, el resumen devolvió 3 reservas; después de la limpieza devuelve 0 reservas y $0 recibidos, acorde con las tablas.
- Validación visual local de `/reservas`: el banner y los filtros se muestran en secciones separadas.
- En la revisión del flujo del 2026-11-13, la BD seguía sin canchas activas ni reservas: hace falta configurar una cancha real desde el módulo protegido antes de poder validar una reserva de extremo a extremo.
- P13: `npm.cmd test`: 78 pruebas pasaron en 22 archivos; `npm.cmd run build`: exitoso.
- P14: la agenda ahora no presenta celdas verdes sin una cancha activa; el clic de una franja libre abre el panel "Tu reserva", la confirmación cierra el panel y bloquea la franja. Pruebas de panel/no-cancha incluidas. `npm.cmd test`: 80 pruebas pasaron en 22 archivos; `npm.cmd run build`: exitoso. En ese momento no se pudo insertar una reserva real porque la BD aún no tenía canchas activas.
- P15: se verificaron las conexiones configuradas y el rol PostgreSQL puede insertar en `reservas` y omite RLS; la verificación transaccional de BD pasó con 0 fallas (1 cancha activa, 0 reservas). El body del formulario ya cumple el esquema; el servidor calcula el precio. En fallos, el cliente muestra el body HTTP en consola solo en desarrollo. No se insertó una reserva artificial; falta el mensaje de respuesta del nuevo intento para identificar el error exacto. `npm.cmd test`: 81 pasaron; build exitoso.
- P16: se verificaron las columnas reales requeridas y coinciden con la transacción del backend. La ruta registra en desarrollo la forma del body (con nombre/teléfono/correo redactados) y el error PostgreSQL con metadatos de código/tabla/columna/restricción; no se añadieron políticas RLS ni campos de columnas inexistentes. `npm.cmd test`: 82 pruebas pasaron; build exitoso.
