# ReservaGol: estado actual del repositorio

Auditoría realizada el 2026-11-07 para P00. Se revisó el repositorio sin mostrar valores de `.env.local`.

## 1. Proyecto y versiones

- Next.js App Router con TypeScript: sí. `next` 16.3.5, React 19.3.0, TypeScript 6.0.3.
- Tailwind CSS: no está instalado ni configurado. Los estilos actuales están en `src/app/globals.css`.
- Vite: hay `vite.config.ts` y dependencias de Vite usadas por Vitest; el servidor y la compilación son Next (`next dev`, `next build`).
- El build de producción de Next completó correctamente (resultado completo en la sección 15).

## 2. Scripts de `package.json`

| Script | Comando |
|---|---|
| `dev` | `next dev --hostname 0.0.0.0` |
| `build` | `next build` |
| `start` | `next start --hostname 0.0.0.0` |
| `lint` | `next build` |
| `test` | `vitest --run` |

No existen scripts de migración, verificación de BD, demo ni prueba de flujo.

## 3. Estructura existente (hasta tres niveles)

```text
src/
  app/
    api/health/route.ts, route.test.ts
    login/page.tsx, page.test.tsx
    reservas/page.tsx
    globals.css, layout.tsx, page.tsx, page.test.tsx
  components/HomeHero.tsx
  data/reservas.ts
  features/reservas/ReservaList.tsx, reservas.test.ts
  lib/health.ts
  test/setup.ts, vitest.d.ts
doc/
  PLAN_RESERVAGOL.md
  PROMPTS_RESERVAGOL.md
  plan-implementacion-fases-ts-fullstack.md
public/
  .gitkeep
```

No existen `supabase/` ni `scripts/`, por lo que tampoco hay directorio de migraciones ni scripts de BD. `.github/` solo contiene `workflows/`; aún no hay instrucciones de Copilot del proyecto.

## 4. Alias de TypeScript

- `@/*` apunta a `./src/*`.
- `@data/*` apunta a `./data/*`.
- Vitest no tiene configurado el alias `@/` en su configuración actual; esto causa dos suites fallidas (sección 12).

## 5. Autenticación

Hay una página de login en `src/app/login/page.tsx`, con validación de campos y credenciales de demostración escritas en el cliente. No crea cookie ni sesión, no llama a un servicio de autenticación y no protege rutas. La ruta raíz renderiza esa página; después del login de demostración navega a `/`. Clasificación: interfaz de login parcial, no autenticación funcional. P03 debe adaptarla a una puerta de acceso real.

## 6. Supabase y conexión a Postgres

En `.env.local` aparecen configurados (solo se registran nombres) `NEXT_PUBLIC_RESERVAGOL_SUPABASE_URL`, `RESERVAGOL_POSTGRES_URL`, `RESERVAGOL_POSTGRES_URL_NON_POOLING` y `RESERVAGOL_POSTGRES_HOST`, entre otros nombres de Supabase/Postgres. Los valores no se leyeron ni se incluyen aquí. La presencia de variables sugiere que el proyecto y la conexión ya fueron preparados, pero no se verificó la conectividad ni el tipo de pooler.

`.env.example` usa `DATABASE_URL`, por lo que su nombre no coincide con la variable presente en `.env.local`. Antes de P01 hay que confirmar en Supabase que `RESERVAGOL_POSTGRES_URL` sea la conexión Transaction pooler (puerto 6543) y que la misma variable esté configurada en los entornos de Vercel que se usarán.

## 7. Datos actuales

Los datos viven en `src/data/reservas.ts` como un arreglo estático de dos reservas de muestra. `ReservaList` solo renderiza esos registros. No hay persistencia ni consultas a Supabase.

## 8. Dependencias relevantes

| Paquete | Estado |
|---|---|
| `pg` / `@types/pg` | Faltan |
| `zod` | Está (`4.6.2`) |
| `@supabase/supabase-js` | Falta |
| `vitest` | Está (`5.0.0`) |
| `tailwindcss` | Falta |

Las versiones instaladas del framework se detallan en la sección 1. No se requiere `@supabase/supabase-js` para el diseño del plan si el acceso a datos se hace mediante `pg` desde el servidor.

## 9. Migraciones

No existe `supabase/migrations/`, ni un ejecutor o historial de migraciones. P01 debe crear `scripts/migrar.mjs` y las dos migraciones según el plan.

## 10. Dominio construido

| Elemento | Estado observado |
|---|---|
| Canchas | No hay modelo persistente, alta ni administración. Los nombres de cancha en los datos son texto de muestra. |
| Clientes | No hay modelo ni flujo. |
| Reservas | Hay dos registros estáticos y una lista de lectura; no hay creación, disponibilidad ni validación de solapes. |
| Cancelación | No existe. |
| Cobros y abonos | No existen. |

## 11. Estilos

Los estilos viven en `src/app/globals.css`, con variables CSS propias y una paleta verde oscura. No hay Tailwind ni `tailwind.config`. La fuente actual es Arial/Helvetica. `src/app/layout.tsx` declara idioma español, título y descripción básicos.

## 12. Pruebas

Vitest está configurado en `vitest.config.ts` con entorno `jsdom`, `@vitejs/plugin-react`, setup de Testing Library y patrón `src/**/*.test.ts(x)`. Hay pruebas para login, página, health endpoint y datos de reservas.

Ejecución base `npm.cmd test`: 4 pruebas pasaron y dos suites fallaron antes de ejecutar sus casos porque Vitest no resolvió los imports `@/lib/health` y `@/data/reservas`. Es un problema de configuración del alias; P02 debe preservar las pruebas existentes al ajustar Vitest.

## 13. Conflictos y superficies existentes

- `src/app/reservas/page.tsx` existe y muestra la lista estática; debe adaptarse, no duplicarse.
- `src/app/api/reservas/` no existe; solo existe `/api/health`.
- `src/lib/dataService.ts` no existe.
- `src/components/ui/` no existe.
- `src/app/page.tsx` renderiza la página de login existente.
- `src/app/login/page.tsx` es una implementación de demostración, no una sesión.
- Hay configuración de Next y también un `vite.config.ts`; `dev` y `build` siguen usando Next.

## 14. Decisiones derivadas para los prompts

- Base: usar el proyecto Next.js existente y su estructura `src/`.
- Login: existe parcialmente; adaptar en P03 para crear sesión y proteger rutas, conservando la página cuando sea viable.
- Protección: usar `proxy.ts`, porque la versión observada es Next.js 16.
- Ruta de login: `/login`.
- Alias de imports: `@/*` para `src/*`; en documentación/instrucciones usar `@/`.
- Conexión: usar `RESERVAGOL_POSTGRES_URL` (verificar que sea el Transaction pooler de Supabase, puerto 6543). No leer ni mostrar sus valores.
- Migraciones: crear `supabase/migrations/0001_reservagol_tablas.sql` (M1) y `supabase/migrations/0002_reservagol_vista_seguridad.sql` (M2); no existe mecanismo previo.
- M1 contiene las tablas y restricciones de la sección 9.2 del plan; M2 contiene vista y seguridad de la sección 9.3.
- Las pruebas usan Vitest. El servidor y las rutas API son Next, no Vite.

## 15. Compilación de base

Ejecutado con `npm.cmd run build` (PowerShell bloquea el shim `npm.ps1`; no se cambió la política del equipo). Resultado: éxito con Next.js 16.3.5/Turbopack.

```text
> reservagol@0.1.0 build
> next build

▲ Next.js 16.3.5 (Turbopack)
- Environments: .env.local
✓ Running next.config.mjs took 15ms

  Creating an optimized production build ...
✓ Compiled successfully in 212ms
✓ Finished TypeScript in 1232ms
✓ Collecting page data using 7 workers in 596ms
✓ Generating static pages using 7 workers (6/6) in 504ms
✓ Finalizing page optimization in 11ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/health
├ ○ /login
└ ○ /reservas

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```