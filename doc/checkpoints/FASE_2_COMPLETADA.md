# Fase 2 completada · Reglas de negocio

## Implementación

- Reglas puras en `src/lib/reglas/`: errores, fechas, horario, reserva, pago y cliente.
- Configuración del dominio en `src/lib/config/reservagol.ts`.
- Pruebas ubicadas bajo `src/test/reglas/`, siguiendo la estructura existente del repositorio.
- Vitest ahora resuelve los alias `@/` y `@data/` de TypeScript.
- Las reglas no importan Next, `pg`, red ni variables de entorno. `new Date()` solo aparece como reloj predeterminado de `hoyBogota`.

## Pruebas

Salida de `npm.cmd test`:

```text
> reservagol@0.1.0 test
> vitest --run

RUN  v5.0.0 C:/Users/Sebastian/Downloads/Logica y programacion/ReservaGol/ReservaGol

Test Files  7 passed (7)
Tests       31 passed (31)
Duration    2.87s
```

Los 31 casos incluyen T-01 a T-25 del plan y las 6 pruebas existentes.

## Compilación

`npm.cmd run build`: exitoso con Next.js 16.3.5; TypeScript y generación de páginas finalizaron sin errores.