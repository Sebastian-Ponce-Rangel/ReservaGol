# Estado de ejecución de prompts

| Prompt | Fase | Estado | Evidencia |
|---|---|---|---|
| P00 | Conciliación | Completado | `ESTADO_ACTUAL.md`, `DICTAMEN.md`, instrucciones y checkpoint Fase 0 |
| P01 | Base de datos | Pendiente | |
| P02 | Reglas de negocio | Pendiente | |
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