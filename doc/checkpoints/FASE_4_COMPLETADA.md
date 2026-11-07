# Fase 4 completada · Datos y API

## API protegida

Se implementaron `GET/POST /api/reservas`, rutas de canchas y clientes, disponibilidad, detalle, cancelación y abonos. Los handlers llaman `await exigirSesion()` como primera instrucción, validan con Zod, responden con `Cache-Control: no-store` y usan `await params` en rutas dinámicas.

## Flujo autenticado en navegador

La prueba se hizo en Next dev usando variables de autenticación efímeras en el proceso; no se modificó `.env.local`.

| Operación | Resultado |
|---|---|
| Login y consulta de sesión | Correctos |
| Crear cancha | HTTP 201 |
| Crear cliente | HTTP 201 |
| Crear reserva | HTTP 201 |
| Crear reserva solapada | HTTP 409 `CHOQUE_HORARIO` |
| Crear franja consecutiva | HTTP 201 |
| Registrar abono de 20000 | HTTP 201, anticipo, saldo 30000 |
| Registrar abono que excede | HTTP 409 `ABONO_EXCEDE_TOTAL` |
| Cancelar franja consecutiva | HTTP 200, reserva cancelada |
| Reservar la franja liberada | HTTP 201 |

Los datos `Prueba API` se eliminaron con `db:limpiar --prueba` después de la prueba; los datos Demo se conservaron.

## Acceso sin sesión

Después de cerrar sesión, se verificaron las ocho rutas `/api/reservas/*` (canchas, clientes, listado, disponibilidad, sesión, detalle, cancelación y abonos). Todas respondieron HTTP 401 en JSON y `Cache-Control: no-store`.

## Verificación de base de datos

`npm.cmd run db:verificar`: 0 fallas. Conteos después de limpiar las pruebas y conservar demos:

| Tabla | Filas |
|---|---:|
| `canchas` | 2 |
| `clientes` | 3 |
| `reservas` | 3 |
| `abonos` | 2 |

Las tablas, la vista, restricciones, índices y RLS están presentes. La transacción de integridad terminó en `ROLLBACK`.

## Compilación y pruebas

- `npm.cmd test`: 42 pruebas pasaron.
- `npm.cmd run build`: exitoso con Next.js 16.3.5.