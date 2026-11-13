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
