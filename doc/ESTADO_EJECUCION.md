# Estado de ejecución de prompts

| Prompt | Fase | Estado | Evidencia |
|---|---|---|---|
| P00 | Conciliación | Completado | `ESTADO_ACTUAL.md`, `DICTAMEN.md`, instrucciones y checkpoint Fase 0 |
| P01 | Base de datos | Completado | M1/M2 aplicadas; `db:verificar` sin fallas; build correcto |
| P02 | Reglas de negocio | Completado | 25 casos del plan y 6 pruebas existentes pasan; build correcto |
| P03 | Infraestructura del servidor | Completado; configurar credenciales para uso manual | 42 tests, build y smoke checks correctos |
| P04 | Datos | Completado; fase 4 sigue abierta hasta P05 | Flujo 15/15, demo cargada, 42 tests y build correcto |
| P05 | API | Completado | API autenticada probada; 8 endpoints sin sesión devuelven 401 |
| P06 | Interfaz base, canchas y clientes | Completado; fase 5 sigue abierta | Gestión UI validada; 42 tests y build correcto |
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

### P03 · 2026-11-07 · Completado

- Se adaptó el login demostrativo a `POST /api/auth/login` con comparación de credenciales en tiempo constante y cookie HMAC firmada, HttpOnly, SameSite=Lax y expiración de siete días. Se añadió logout.
- `src/proxy.ts` protege `/reservas/:path*` y `/api/reservas/:path*`; las API devuelven 401 JSON sin sesión. La ruta de sesión requiere `exigirSesion()` y es dinámica.
- Se añadieron `conexion.ts` con parsers de `pg`, respuestas `no-store`, esquemas Zod y formatos de dinero/fecha/hora. La conexión de aplicación usa `RESERVAGOL_POSTGRES_URL` y normaliza SSL en memoria.
- `npm.cmd test`: 42 pruebas pasaron. `npm.cmd run build`: exitoso.
- Smoke en Next dev: `/` y `/reservas` redirigen a `/login`; `GET /api/reservas/sesion` devuelve 401 con `Cache-Control: no-store`.
- No se leyeron ni escribieron credenciales locales. Para iniciar sesión manualmente hay que configurar `RESERVAGOL_ADMIN_EMAIL`, `RESERVAGOL_ADMIN_PASSWORD` y `RESERVAGOL_SESSION_SECRET` (mínimo 32 caracteres) en `.env.local` y en Vercel. Tests usan variables efímeras.
- Evidencia completa: `doc/checkpoints/FASE_3_COMPLETADA.md`.

### P04 · 2026-11-07 · Completado (fase 4 abierta)

- Se crearon la fachada `dataService`, tipos y módulos de datos para canchas, clientes, reservas, resúmenes y limpieza.
- La creación de reserva bloquea la fila de la cancha, verifica entidades activas, bloquea y evalúa las franjas existentes dentro de una transacción. Los abonos se serializan bloqueando su reserva; el estado del pago se deriva de la vista/abonos.
- Se añadieron `db:limpiar`, `db:demo`, `probar:flujo` y el runner `tsx`. Los scripts acceden a datos solo mediante `dataService` salvo el helper de cierre del pool.
- Salida de `probar:flujo`: 15 pasos `OK`, 0 fallas; limpieza final de datos Prueba completada.
- Salida de `db:limpiar --prueba`: 0 abonos, 0 reservas, 0 clientes y 0 canchas eliminados.
- Salida de `db:demo`: 2 canchas y 3 clientes; una reserva pendiente, una con anticipo (20.000 de 50.000) y una pagada (50.000 de 50.000), en fechas 2026-11-08 a 2026-11-10.
- `npm.cmd test`: 42 pruebas pasaron. `npm.cmd run build`: exitoso.
- Fase 4 permanece abierta hasta completar y verificar P05.

### P05 · 2026-11-07 · Completado (fase 4 cerrada)

- Se crearon las rutas protegidas de canchas, clientes, reservas, disponibilidad, detalle, cancelación y abonos. Cada handler exige sesión primero; rutas dinámicas esperan `params`.
- Smoke autenticado con credenciales efímeras: login/sesión OK; POST de cancha, cliente y reserva devolvieron 201; solape devolvió 409 `CHOQUE_HORARIO`; abono parcial devolvió 201 (`anticipo`, saldo 30000); abono excesivo devolvió 409 `ABONO_EXCEDE_TOTAL`; cancelación devolvió 200 y la franja se pudo reservar de nuevo (201).
- Tras logout, las ocho rutas probadas de `/api/reservas/*` devolvieron 401 JSON con `Cache-Control: no-store`.
- Los datos `Prueba API` se limpiaron; los registros `Demo` se conservaron.
- `npm.cmd test`: 42 pruebas pasaron. `npm.cmd run build`: exitoso.
- `npm.cmd run db:verificar`: 0 fallas; 2 canchas, 3 clientes, 3 reservas y 2 abonos demo presentes; restricciones e integridad correctas.
- Evidencia completa: `doc/checkpoints/FASE_4_COMPLETADA.md`.

### P06 · 2026-11-07 · Completado (fase 5 abierta)

- Se creó el shell autenticado de `/reservas` con navegación Agenda/Canchas/Clientes, correo de sesión y cierre de sesión.
- Se añadieron componentes UI accesibles y propios: botones, campos, selector, tarjeta, insignia, aviso, diálogo nativo y estado vacío; no se instalaron librerías de componentes.
- Agenda muestra reservas activas reales. Canchas y Clientes permiten crear, listar, mostrar estados y desactivar sin borrar; la API muestra el error de cancha duplicada.
- Smoke UI en Next dev: datos Demo visibles; alta de `Prueba P06 Cancha`, duplicado rechazado, desactivación preservada como inactiva; alta/desactivación de cliente; limpieza posterior de datos Prueba.
- Responsive: a 390 px, `documentWidth` fue 375 px (sin overflow horizontal). Diálogo verificado con foco inicial y Escape.
- `npm.cmd test`: 42 pruebas pasaron. `npm.cmd run build`: exitoso.
- La fase 5 continúa abierta hasta completar P07 y P08.
- Evidencia: `doc/checkpoints/FASE_5_P06_COMPLETADA.md`.