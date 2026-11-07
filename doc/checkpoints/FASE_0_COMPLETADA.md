# Fase 0 completada · Conciliación

## Infraestructura

- Next.js 16.3.5 App Router con TypeScript 6.0.3 y React 19.3.0: compila y se conserva.
- Tailwind CSS, `pg`, capa de conexión y migraciones: no existen todavía.
- Hay variables locales Supabase/Postgres, pero no se expusieron sus valores ni se comprobó conectividad.
- La página `/login` es demostrativa y no crea sesión; adaptar en P03.
- Hay Vitest y pruebas existentes; el build base pasa, pero 2 suites fallan por la resolución del alias `@/`.

## Dictamen resumido

- **USAR:** proyecto Next.js + TypeScript, estructura `src/`, configuración existente de Next, Zod y Vitest.
- **ADAPTAR:** conexión Supabase/Postgres ya configurada localmente (confirmar Transaction pooler), formulario de login, lista estática de reservas y pruebas Vitest.
- **CREAR:** migraciones y scripts de BD, capa `pg`, reglas de negocio, sesión real, API protegida, gestión de canchas/clientes, reservas persistentes, cancelación, cobros y abonos.

## Antes de P01

Confirma en Supabase que `RESERVAGOL_POSTGRES_URL` sea una URL de **Connect → Transaction pooler**, puerto **6543**, y que el proyecto permita crear el esquema. Configura esa variable en los entornos correspondientes de Vercel sin ponerla en Git ni compartir su valor. P01 debe probar la conexión antes de aplicar migraciones; si falla, debe detenerse.

## Verificaciones

- `npm.cmd run build`: exitoso.
- `npm.cmd test`: 4 pruebas pasaron; 2 suites fallaron por falta del alias `@/` en Vitest. No se modificaron pruebas en P00.