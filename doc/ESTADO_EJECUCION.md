# Estado de ejecución de prompts

| Prompt | Fase | Estado | Evidencia |
|---|---|---|---|
| P00 | Conciliación | Completado | `ESTADO_ACTUAL.md`, `DICTAMEN.md`, instrucciones y checkpoint Fase 0 |
| P01 | Base de datos | Completado | M1/M2 aplicadas; `db:verificar` sin fallas; build correcto |
| P02 | Reglas de negocio | Completado | 25 casos del plan y 6 pruebas existentes pasan; build correcto |
| P03 | Infraestructura del servidor | Pendiente | |
| P04 | Datos | Pendiente | |
| P05 | API | Pendiente | |
| P06 | Interfaz base, canchas y clientes | Pendiente | |
| P07 | Agenda y creación de reservas | Pendiente | |
| P08 | Detalle, cobro y aceptación | Pendiente | |
| P09 | Opcionales | Pendiente | |

## Bitácora

### P00 · 2026-11-07

- Auditoría: Next.js 16.3.5 App Router; TypeScript 6.0.3; React 19.3.0. Build de producción correcto.
- Hallazgos: login demostrativo sin sesión; reservas estáticas; no hay `pg`, migraciones, `dataService`, rutas de reservas ni funcionalidades de canchas, clientes, cancelación o cobros.
- Base de datos: hay nombres de variables Supabase/Postgres configurados localmente. No se leyeron valores ni se verificó conectividad. Antes de P01 confirmar Transaction pooler, puerto 6543, permisos y configuración de Vercel.
- Pruebas base: `npm.cmd test` reportó 4 pruebas pasadas y 2 suites fallidas por alias `@/` sin configurar en Vitest. Resolver durante P02.
- Cambios del prompt: se crearon `doc/ESTADO_ACTUAL.md`, `doc/DICTAMEN.md`, `.github/copilot-instructions.md` y `doc/checkpoints/FASE_0_COMPLETADA.md`.

### P01 · 2026-11-07 · Completado

- `pg` y `@types/pg` instalados desde el registro npm-compatible de Yarn; el registro npm oficial no era accesible desde este entorno.
- Creados `supabase/migrations/0001_reservagol_tablas.sql`, `0002_reservagol_vista_seguridad.sql`, `scripts/conexion.mjs`, `scripts/migrar.mjs` y `scripts/verificar-bd.mjs`; agregados `db:migrar` y `db:verificar`.
- Para scripts administrativos se usa `RESERVAGOL_POSTGRES_URL_NON_POOLING` cuando existe. Los dos endpoints se verificaron como el mismo host, usuario, base y contraseña; el de sesión es accesible desde el entorno. Los parámetros SSL de la URL se quitan solo en memoria para respetar `ssl: { rejectUnauthorized: false }`. La aplicación usará `RESERVAGOL_POSTGRES_URL` (pooler transaccional).
- `npm.cmd run db:migrar`: aplicadas `0001_reservagol_tablas.sql` y `0002_reservagol_vista_seguridad.sql`.
- `npm.cmd run db:verificar`: 0 fallas. El test de integridad corre dentro de una transacción que termina en `ROLLBACK`; conteos observados: 0 filas en las cuatro tablas.
- `npm.cmd run build`: exitoso. `node --check` pasó para los dos scripts.
- Evidencia completa: `doc/checkpoints/FASE_1_COMPLETADA.md`.

### P02 · 2026-11-07 · Completado

- Se configuraron en Vitest los alias `@/` y `@data/`, resolviendo las dos suites que fallaban en la línea base.
- Se crearon la configuración del dominio y las reglas puras de errores, fechas, horario, reserva, pago y cliente, con 25 casos T-01 a T-25.
- `npm.cmd test`: 31 pruebas pasaron (25 nuevas y 6 preexistentes).
- `npm.cmd run build`: exitoso; compilación, tipos y páginas estáticas correctos.
- Evidencia completa: `doc/checkpoints/FASE_2_COMPLETADA.md`.