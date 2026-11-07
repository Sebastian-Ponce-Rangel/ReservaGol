# P04 completado · Datos (fase 4 abierta)

P04 entrega la capa de datos y el flujo de integración. La fase 4 continúa abierta hasta finalizar P05 (API).

## Implementación

- `src/lib/dataService.ts` es la fachada pública de canchas, clientes, reservas, cobros, limpieza y resúmenes opcionales.
- Los módulos de `src/lib/datos/` contienen SQL parametrizado; ningún archivo fuera de esa carpeta importa `src/lib/db/conexion.ts`.
- Crear una reserva valida reglas, bloquea la cancha y el cliente activos, consulta franjas activas con `FOR UPDATE`, aplica el solape semiabierto y hace la inserción en una transacción. El lock de la cancha serializa las reservas concurrentes incluso cuando aún no hay reservas para esa fecha.
- Los abonos bloquean la reserva, comprueban estado/monto/saldo e insertan en una transacción. El estado de pago se deriva de los abonos, no se persiste.
- Scripts añadidos: `db:limpiar`, `db:demo`, `probar:flujo`.

## Verificación de flujo

Salida de `probar:flujo` contra Supabase:

```text
OK 1) crear cancha Prueba Cancha 1
OK 2) rechazar nombre duplicado: esperado CANCHA_DUPLICADA
OK 3) crear cliente Prueba Cliente
OK 4) crear reserva activa 18:00-19:00
OK 5) rechazar solape parcial: esperado CHOQUE_HORARIO
OK 6) permitir franja consecutiva 19:00-20:00
OK 7) rechazar fecha pasada: esperado FECHA_INVALIDA
OK 8) rechazar hora fin anterior: esperado DATOS_INVALIDOS
OK 9) disponibilidad contiene dos franjas
OK 10) registrar anticipo de 20000 y saldo de 30000
OK 11) rechazar abono que excede el total: esperado ABONO_EXCEDE_TOTAL
OK 12) completar el pago y dejar saldo cero
OK 13) cancelar la reserva consecutiva
OK 14) volver a reservar la franja liberada
OK 15) rechazar abono en reserva cancelada: esperado RESERVA_CANCELADA
Total de fallas: 0
```

La limpieza final del script eliminó los registros `Prueba` creados para la prueba.

## Limpieza y datos demo

`db:limpiar --prueba` finalizó correctamente: 0 abonos, 0 reservas, 0 clientes y 0 canchas de prueba eliminados.

`db:demo` produjo:

| Cancha | Cliente | Fecha | Estado | Total | Abonado |
|---|---|---|---|---:|---:|
| Demo Cancha Central | Demo Cliente Uno | 2026-11-08 | pendiente | 50000 | 0 |
| Demo Cancha Central | Demo Cliente Dos | 2026-11-09 | anticipo | 50000 | 20000 |
| Demo Cancha Norte | Demo Cliente Tres | 2026-11-10 | pagado | 50000 | 50000 |

Los datos Demo permanecen en la base.

## Verificaciones de proyecto

- `npm.cmd test`: 42 pruebas pasaron.
- `npm.cmd run build`: exitoso con Next.js 16.3.5 y TypeScript.
- `.vscode/tasks.json` quedó restaurado a su contenido previo; no se añadieron tareas del diagnóstico.