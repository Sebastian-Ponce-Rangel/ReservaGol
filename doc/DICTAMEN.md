# Dictamen de conciliación

Estados basados en la auditoría P00 de `doc/ESTADO_ACTUAL.md`. “Existe” se refiere a lo necesario para el módulo, no solo a que haya una pantalla o variable con ese nombre.

## Infraestructura

### Proyecto Next.js + TypeScript
- Estado: EXISTE Y SIRVE
- Qué hacer: USAR
- Detalle: Next.js 16.3.5 App Router compila; conservar `src/`, React y TypeScript.

### Tailwind CSS
- Estado: NO EXISTE
- Qué hacer: CREAR
- Detalle: no está instalado. P06 debe elegir la adaptación mínima compatible con la interfaz y el CSS existente; no instalarlo antes de confirmar que hace falta.

### Conexión Supabase/Postgres
- Estado: EXISTE PARCIAL
- Qué hacer: ADAPTAR
- Detalle: hay nombres y valores configurados localmente para Supabase/Postgres, pero no hay `pg`, capa de conexión ni verificación de conectividad. P00 no leyó valores. P01 verifica conexión antes de crear/aplicar migraciones y usa `RESERVAGOL_POSTGRES_URL` si es Transaction pooler de puerto 6543.

### Login y sesión
- Estado: EXISTE PARCIAL
- Qué hacer: ADAPTAR
- Detalle: hay formulario de demostración en `/login`, sin cookie ni protección. P03 debe convertirlo en puerta real y proteger `/reservas/*` y `/api/reservas/*` sin roles.

### Migraciones
- Estado: NO EXISTE
- Qué hacer: CREAR
- Detalle: P01 crea el ejecutor y las migraciones M1/M2, con los nombres registrados en `doc/ESTADO_ACTUAL.md`.

## Funcionalidades del módulo mínimo

### F1 · Canchas
- Estado: NO EXISTE
- Qué hacer: CREAR
- Detalle: crear modelo/datos, API y pantalla en P04/P05/P06; el nombre de cancha en una reserva estática no es gestión de canchas.

### F2 · Clientes
- Estado: NO EXISTE
- Qué hacer: CREAR
- Detalle: crear modelo/datos, API y pantalla en P04/P05/P06.

### F3 · Crear reserva con verificación de disponibilidad
- Estado: EXISTE PARCIAL
- Qué hacer: ADAPTAR
- Detalle: hoy solo hay registros estáticos y una lista. Crear reglas en P02, persistencia transaccional en P04, API en P05 e interfaz en P07.

### F4 · Consultar disponibilidad
- Estado: EXISTE PARCIAL
- Qué hacer: ADAPTAR
- Detalle: existe una vista estática de reservas, pero no consulta por cancha/fecha ni calcula disponibilidad. Implementar datos/API en P04/P05 e interfaz en P07.

### F5 · Cancelar reserva
- Estado: NO EXISTE
- Qué hacer: CREAR
- Detalle: operación en P04/P05 e interfaz en P08; cancelar debe liberar la franja sin borrar la reserva.

### F6 · Cobro con abonos
- Estado: NO EXISTE
- Qué hacer: CREAR
- Detalle: estado derivado y reglas en P02, persistencia en P04, API en P05 e interfaz en P08.

## Resumen

| Pieza | Estado | Acción |
|---|---|---|
| Next.js + TypeScript | EXISTE Y SIRVE | USAR |
| Tailwind CSS | NO EXISTE | CREAR |
| Supabase/Postgres | EXISTE PARCIAL | ADAPTAR |
| Login/sesión | EXISTE PARCIAL | ADAPTAR |
| Migraciones | NO EXISTE | CREAR |
| F1 Canchas | NO EXISTE | CREAR |
| F2 Clientes | NO EXISTE | CREAR |
| F3 Crear reserva | EXISTE PARCIAL | ADAPTAR |
| F4 Disponibilidad | EXISTE PARCIAL | ADAPTAR |
| F5 Cancelación | NO EXISTE | CREAR |
| F6 Cobro/abonos | NO EXISTE | CREAR |

## Antes de P01

1. Las variables locales de Supabase/Postgres aparecen configuradas, pero no se verificó su conectividad ni el modo de conexión. En Supabase, confirma que `RESERVAGOL_POSTGRES_URL` corresponda a **Connect → Transaction pooler**, puerto **6543**. No compartas ni pegues el valor en el chat.
2. Confirma que el proyecto de Supabase esté activo y que la conexión tenga permiso para crear tablas, índices, vistas, funciones y triggers.
3. En Vercel, configura `RESERVAGOL_POSTGRES_URL` en los entornos que desplegarás (Development, Preview y/o Production). El valor se obtiene en Supabase; nunca se versiona en Git. La auditoría no comprobó las variables de Vercel.
4. P01 debe probar la conexión antes de migrar. Si falla, detenerse y corregir la variable en el entorno local/Vercel; no crear un proyecto ni aplicar SQL hasta confirmar el destino.

No es necesario crear ahora un proyecto Supabase: la configuración local ya indica que existe uno preparado, aunque falta confirmar que sea accesible y que use el pooler recomendado.