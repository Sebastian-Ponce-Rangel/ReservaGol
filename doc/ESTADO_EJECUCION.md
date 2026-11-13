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
| P07 | Agenda y creación de reservas | Completado; fase 5 sigue abierta | Agenda y formulario probados; 42 tests y build correcto |
| P08 | Detalle, cobro y aceptación | Completado | `ACEPTACION.md`, checkpoints Fase 5 y 6; 42 tests, flujo 15/15 y build correctos |
| P09 | Opcionales | Implementado; aceptación manual pendiente | `FASE_7_COMPLETADA.md`; build y 47 pruebas correctos; A-15 requiere sesión local |
| P10 | Disponibilidad, navegación e identidad visual | Completado | `FASE_8_COMPLETADA.md`; actualización pública cada 5 s; 73 pruebas y build correctos |
| P11 | Sincronización de agenda y contaduría | Completado | `FASE_9_COMPLETADA.md`; 77 pruebas, build y consultas de BD correctos |
| P12 | Reservas en contaduría y retiro de datos simulados | Completado | `FASE_9_COMPLETADA.md`; panel enlazado a `v_reservas`, datos Demo/Prueba retirados, 77 pruebas y build correctos |
| P13 | Visibilidad de reservas recientes y diagnóstico del formulario | Completado con prerrequisito operativo | `FASE_9_COMPLETADA.md`; listado sin filtro por mes, errores registrados sin datos personales; BD verificada sin canchas ni reservas reales |
| P14 | Restaurar panel de agenda sin canchas configuradas | Completado con prerrequisito operativo | `FASE_9_COMPLETADA.md`; clic abre formulario, confirmación bloquea franja; estado vacío claro cuando no hay canchas; 80 pruebas y build correctos |
| P15 | Diagnóstico de respuestas rechazadas por API pública | Completado; diagnóstico real pendiente de nuevo intento | `FASE_9_COMPLETADA.md`; cuerpo de error visible en consola de desarrollo, permisos/RLS verificados, 81 pruebas y build correctos |
| P16 | Diagnóstico servidor y conciliación de campos del POST | Completado; error de ejecución original aún no recibido | `FASE_9_COMPLETADA.md`; log de forma de body con PII redactada, errores PostgreSQL detallados en desarrollo, 82 pruebas y build correctos |

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

### P07 · 2026-11-07 · Completado (fase 5 abierta)

- La Agenda filtra por cancha y fecha, muestra reservas activas con cliente/horario/estado de pago y calcula los huecos libres entre 06:00 y 23:00.
- El formulario crea reservas por API y valida fecha no pasada, fin posterior al inicio y valor entero positivo. Los choques parciales muestran cancha y franja en conflicto.
- Smoke con datos `Prueba P07`: 18:00–19:00 creada; 18:30–19:30 rechazada con el mensaje esperado; 19:00–20:00 creada. Fixture limpiado después.
- `npm.cmd test`: 42 pruebas pasaron. `npm.cmd run build`: exitoso.
- Responsive verificado a 390 px: sin overflow horizontal.
- La fase 5 sigue abierta hasta P08.
- Evidencia: `doc/checkpoints/FASE_5_P07_COMPLETADA.md`.

### P08 · 2026-11-08 · Completado

- Se verificaron los entregables ya presentes: detalle de reserva, panel de cobro y cancelación, `doc/ACEPTACION.md` con A-01 a A-15 y README actualizado. A-15 queda para P09; A-01 a A-14 se ejecutan en Vercel.
- Revisión de reglas y seguridad sin defectos pendientes: creación de reservas dentro de transacción con bloqueo de cancha y reservas activas; franjas semiabiertas; estado de pago derivado; abonos enteros limitados al saldo; fecha actual mediante `hoyBogota()`; rutas protegidas con `exigirSesion()`; SQL parametrizado y estados con texto además de color.
- `npm.cmd run probar:flujo`: 15/15 pasos correctos. `npm.cmd test`: 42 pruebas pasaron.
- `npm.cmd run db:limpiar -- --prueba`: 0 registros de prueba eliminados; los datos Demo se conservaron.
- `.env.local` está excluido por `.gitignore` y no está versionado. El único archivo de entorno rastreado es `.env.example`, con valores vacíos; no se detectaron credenciales versionadas.
- `npm.cmd run build`: exitoso. Checkpoints: `FASE_5_COMPLETADA.md` y `FASE_6_COMPLETADA.md`.

### P09 · 2026-11-08 · Implementado

- Se habilitó la agenda de todas las canchas para una fecha, conservando solo reservas activas y mostrando cada hora de 06:00 a 23:00 como ocupada o libre.
- Se añadió `GET /api/reservas/resumen?desde=&hasta=` autenticado, con validación de fechas y rechazo de rangos invertidos. El resumen cuenta reservas y estados de pago por fecha de reserva; suma abonos también de reservas canceladas, porque no hay flujo de reembolso.
- `/reservas/resumen` presenta la rejilla y el resumen del periodo. El rango inicial cubre el mes actual.
- `npm.cmd run build`: exitoso. `npm.cmd test`: 47 pruebas pasaron.
- A-15 está implementado pero su comprobación visual local queda pendiente: el navegador redirigió a `/login` y no se inició sesión. Según el fixture Demo documentado en P04, el total esperado es $70.000 ($20.000 + $50.000), con tres reservas (una pendiente, una con anticipo y una pagada); no se registró como resultado observado.
- La aceptación en Vercel permanece pendiente según el procedimiento de `doc/ACEPTACION.md`.
- Evidencia: `doc/checkpoints/FASE_7_COMPLETADA.md`.

### P10 · 2026-11-13 · Completado

- La agenda pública actualiza la disponibilidad desde el endpoint público cada cinco segundos y refresca inmediatamente después de una reserva exitosa; las franjas recién ocupadas se muestran en rojo en el navegador actual y en los demás usuarios conectados.
- Las vistas de `/reservas/*` muestran la navegación autenticada cuando hay sesión; conserva los accesos a Contaduría, Canchas, Clientes y Resumen. La barra administrativa permanece sticky durante la navegación.
- Se reemplazaron las marcas `RG` por un trofeo y el nombre ReservaGol en las cabeceras públicas y privadas; se mantiene contraste legible en el login.
- No se modificó la persistencia ni la conexión Postgres existente. La creación pública sigue guardando una reserva activa transaccionalmente.
- `npm.cmd test`: 73 pruebas pasaron. `npm.cmd run build`: exitoso.
- Evidencia: `doc/checkpoints/FASE_8_COMPLETADA.md`.

### P11 · 2026-11-13 · Completado

- La agenda pública organiza hero, filtros y agenda en una cuadrícula con separación explícita para evitar solapamientos.
- La reserva pública guarda cliente y franja exacta en la misma transacción; las pruebas cubren la asociación, fecha, horas y estado activo.
- El panel de Contaduría y Clientes se actualiza cada cinco segundos. `resumenAdministrador` y `listarClientesConReservas` leen la vista compartida `v_reservas`, que refleja reservas y abonos de las tablas activas.
- Clientes ahora muestra teléfono, correo y cada reserva con cancha, fecha/hora, total, anticipo requerido, abono realmente registrado, saldo y estado de pago. El anticipo pendiente no se contabiliza como ingreso.
- `npm.cmd run db:verificar`: 0 fallas. Lectura de solo consulta en la BD configurada: 3 clientes, 3 reservas, 3 alquileres en el período y $70.000 registrados; no se imprimieron datos personales ni secretos.
- Validación visual local de `/reservas`: hero y filtros quedan en filas separadas.
- `npm.cmd test`: 77 pruebas pasaron en 23 archivos. `npm.cmd run build`: exitoso.
- Evidencia: `doc/checkpoints/FASE_9_COMPLETADA.md`.

### P12 · 2026-11-13 · Completado

- Contaduría muestra las últimas diez reservas del período seleccionado, consultadas desde `v_reservas` y vinculadas a los datos del cliente. Incluye contacto, correo, cancha, fecha, horario, total, anticipo requerido, abonos recibidos, saldo y estados.
- El panel conserva la actualización cada cinco segundos y el resumen financiero continúa contando únicamente abonos recibidos.
- Se retiraron el fixture estático antiguo de reservas y su prueba de datos semilla; las rutas de la aplicación usan la capa de datos conectada a Postgres.
- Por solicitud de eliminar datos de prueba, `db:limpiar` retiró 2 abonos, 3 reservas, 3 clientes y 2 canchas con prefijos Demo/Prueba. La base configurada quedó sin registros de dominio; el panel refleja correctamente el estado vacío hasta que se creen reservas reales.
- `npm.cmd run db:verificar`: 0 fallas. Consulta del panel contra la BD después de la limpieza: 0 reservas y $0 en abonos, coincidente con las tablas vacías.
- `npm.cmd test`: 77 pruebas pasaron en 22 archivos. `npm.cmd run build`: exitoso.
- Evidencia: `doc/checkpoints/FASE_9_COMPLETADA.md`.

### P13 · 2026-11-13 · Completado con prerrequisito operativo

- Contaduría separa las métricas por período de la tabla de reservas recientes. La tabla consulta todas las reservas persistidas, ordenadas por creación, sin limitarse al mes seleccionado ni truncarlas a diez filas.
- El formulario registra errores de red, respuestas inválidas y rechazos del servidor en consola sin incluir datos personales; tras una creación exitosa sigue marcando la franja como ocupada inmediatamente y consulta de nuevo la disponibilidad.
- La lectura de solo consulta a la base configurada confirmó 0 canchas activas y 0 reservas. Sin una cancha real configurada no se puede completar una reserva ni verificar un recorrido real cliente→agenda→Contaduría; no se insertaron datos simulados.
- `npm.cmd test`: 78 pruebas pasaron en 22 archivos. `npm.cmd run build`: exitoso.
- Evidencia: `doc/checkpoints/FASE_9_COMPLETADA.md`.

### P14 · 2026-11-13 · Completado con prerrequisito operativo

- Se verificó que el `onClick` de las franjas libres abría el panel cuando existía una cancha. El problema real de la BD vacía era que la agenda mostraba franjas verdes aunque no había cancha seleccionable; por la condición del panel, el clic no podía abrir el formulario.
- Si no hay cancha activa, la agenda muestra un estado vacío explicativo en lugar de franjas verdes. El selector de franja valida cancha, fecha y solapes antes de abrir el formulario.
- Se añadieron pruebas para apertura del panel, cierre tras guardar y vista sin canchas. El flujo de persistencia sigue llamando la API de servidor, que inserta en una transacción PostgreSQL; no se expone el cliente Supabase en el navegador.
- `npm.cmd test`: 80 pruebas pasaron en 22 archivos. `npm.cmd run build`: exitoso.
- La BD sigue sin canchas activas ni reservas, por lo que la prueba de extremo a extremo con datos reales queda bloqueada hasta registrar una cancha real.
- Evidencia: `doc/checkpoints/FASE_9_COMPLETADA.md`.

### P15 · 2026-11-13 · Completado; diagnóstico real pendiente de nuevo intento

- Problems no muestra errores de TypeScript o editor. No había una sesión de servidor Next.js adjunta a esta conversación para leer su terminal.
- Se verificaron ambas conexiones configuradas sin revelar sus cadenas: ambas tienen permiso `INSERT` en `reservas` y usan un rol que omite RLS. `db:verificar` pasó con 0 fallas; existe 1 cancha activa y 0 reservas. No corresponde agregar políticas RLS públicas.
- El body del formulario ya cumple `esquemaReservaPublica` (`canchaId`, `clienteNuevo`, `fecha`, `horaInicio`, `horaFin`, método y consentimiento). No envía precio por diseño: el backend calcula el total desde la tarifa guardada para evitar manipulación.
- `AgendaCliente` ahora lee una sola vez el body con `response.text()`, registra el texto completo solo en desarrollo y presenta el mensaje/código del backend. Producción registra únicamente estado y código de error.
- No se reprodujo el POST real para evitar crear una reserva de prueba persistente. El mensaje “El servidor rechazó la reserva” no incluye el cuerpo de respuesta; el código exacto se conocerá al reintentar con el nuevo diagnóstico.
- `npm.cmd test`: 81 pruebas pasaron en 22 archivos. `npm.cmd run build`: exitoso.
- Evidencia: `doc/checkpoints/FASE_9_COMPLETADA.md`.

### P16 · 2026-11-13 · Completado; error de ejecución original aún no recibido

- La inspección de la base confirma `clientes.nombre`, `clientes.contacto`, `clientes.email` y las columnas requeridas de `reservas`, además de `metodo_anticipo` y `privacidad_aceptada_en`. La inserción actual suministra todos los campos obligatorios; el backend deriva `cliente_id` y calcula `valor_total`.
- `/api/reservas/publica` registra en desarrollo los nombres y tipos de campos recibidos, fecha y horas; los valores de nombre, teléfono y correo quedan redactados. Si PostgreSQL rechaza la transacción, el servidor registra código, restricción, tabla y columna; en desarrollo incluye también el objeto de error.
- Las comprobaciones anteriores de ambas conexiones muestran permiso INSERT y rol que omite RLS. No se añadieron políticas públicas ni se cambió el esquema o el body.
- `npm.cmd test`: 82 pruebas pasaron en 22 archivos. `npm.cmd run build`: exitoso.
- El mensaje exacto de la ejecución del usuario no está disponible todavía; el nuevo log permitirá identificarlo en el próximo intento sin registrar PII.
- Evidencia: `doc/checkpoints/FASE_9_COMPLETADA.md`.