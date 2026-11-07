# ReservaGol · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: `doc/PLAN_RESERVAGOL.md`. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: `doc/ESTADO_ACTUAL.md`.
- Dictamen de conciliación: `doc/DICTAMEN.md`. Antes de crear algo, revisa si ya existe y debe adaptarse.
- Avance: `doc/ESTADO_EJECUCION.md`.

## Stack objetivo
- Next.js App Router 16 + TypeScript. El servidor y las rutas API son Next; Vitest es para pruebas. Despliegue en Vercel.
- Postgres de Supabase mediante `pg`; la aplicación usa `RESERVAGOL_POSTGRES_URL` y los scripts administrativos prefieren `RESERVAGOL_POSTGRES_URL_NON_POOLING`. No muestres ni registres valores de entorno.
- Validación con Zod. Pruebas con Vitest.
- App y código compartido en `src/`; alias `@/*` apunta a `src/*`.
- La interfaz de login actual es demostrativa: adaptarla a sesión real en P03. Ruta `/login`; en Next 16 usar `proxy.ts` si aplica.

## Reglas del dominio
- Choque de horarios: dos reservas activas de la misma cancha y día chocan si sus franjas semiabiertas `[inicio, fin)` se solapan: `aInicio < bFin && bInicio < aFin`. 18-19 y 19-20 no chocan. Verificar en una transacción con reservas activas bloqueadas.
- Estado del pago derivado de abonos frente al total: sin abonos, pendiente; abonado menor al total, anticipo; abonado igual o mayor, pagado. No guardar un estado editable. Un abono no puede superar el saldo.
- Una reserva nace activa; cancelarla libera su franja. Reservas y abonos son inmutables.
- No se reserva en fecha pasada. La zona horaria es `America/Bogota`.

## Convenciones
- Identificadores, mensajes, comentarios y textos de interfaz en español.
- Reglas de negocio en `src/lib/reglas/`: funciones puras, sin `pg`, red, Next, variables de entorno ni reloj (salvo `fechas.ts`).
- Solo `src/lib/datos/` importa `src/lib/db/conexion.ts`. Rutas y páginas acceden a datos mediante `src/lib/dataService.ts`.
- Cada ruta `/api/reservas/*` debe ejecutar `await exigirSesion()` como primera instrucción.
- Montos en pesos enteros. Horas `HH:MM`; fechas `YYYY-MM-DD`; usar `hoyBogota()` para hoy.
- En rutas dinámicas `params` es una Promise: `const { id } = await params`.
- SQL parametrizado siempre; nunca concatenar valores.
- Canchas y clientes se desactivan; no se eliminan. Reservas se cancelan.
- No instalar librerías de componentes. Reutiliza el CSS actual y añade componentes propios solo cuando P06 lo requiera.

## Al terminar cada prompt
1. Ejecuta `npm.cmd run build` sin errores.
2. Ejecuta `npm.cmd test` sin fallas desde que Vitest esté configurado correctamente.
3. Actualiza `doc/ESTADO_EJECUCION.md` y el checkpoint correspondiente.
4. El estudiante solicitó commit y push por prompt; prepara solo los archivos de ese prompt y nunca incluyas `.env.local` ni cambios ajenos.