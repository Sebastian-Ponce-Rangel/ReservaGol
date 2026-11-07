# Fase 1 completada · Base de datos

## Resultado

- M1 creó `canchas`, `clientes`, `reservas`, `abonos`, sus restricciones e índices.
- M2 creó `v_reservas`, activó RLS en las cuatro tablas y revocó permisos públicos.
- Las migraciones quedaron registradas en `_migrations`.
- Los scripts de administración usan la URL de sesión cuando existe. Se confirmó que ambos endpoints configurados son del mismo host, usuario y base. La URL se normaliza en memoria para que los parámetros `sslmode` no anulen `ssl: { rejectUnauthorized: false }`.
- La aplicación debe conservar `RESERVAGOL_POSTGRES_URL` (pooler transaccional); las migraciones/verificaciones locales usan `RESERVAGOL_POSTGRES_URL_NON_POOLING`.

## Verificación de base de datos

Salida de `npm.cmd run db:verificar`:

```text
OK objeto canchas existe
OK objeto clientes existe
OK objeto reservas existe
OK objeto abonos existe
OK objeto vista existe
Filas canchas: 0
Filas clientes: 0
Filas reservas: 0
Filas abonos: 0
OK restricción/índice reservas_horas_ok
OK restricción/índice reservas_valor_ok
OK restricción/índice abonos_monto_positivo
OK restricción/índice ux_canchas_nombre
OK restricción/índice ux_reservas_slot_activo
OK RLS activo en canchas
OK RLS activo en clientes
OK RLS activo en reservas
OK RLS activo en abonos
OK a) Crear cancha Verif C1
OK a duplicado: esperado 23505 (ux_canchas_nombre)
OK b) Crear cliente Verif Cli
OK c) Crear reserva válida
OK d horas inválidas: esperado 23514 (reservas_horas_ok)
OK e valor cero: esperado 23514 (reservas_valor_ok)
OK f franja duplicada: esperado 23505 (ux_reservas_slot_activo)
OK g abono cero: esperado 23514 (abonos_monto_positivo)
OK h) Vista calcula abonado 20000
Total de fallas: 0
```

La prueba de integridad termina con `ROLLBACK`; los conteos posteriores a la migración permanecen en cero.

## Compilación

`npm.cmd run build`: exitoso con Next.js 16.3.5.