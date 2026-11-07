# Fase 3 completada · Infraestructura del servidor

## Decisión de acceso

Se conservó la pantalla de login existente y se conectó a `POST /api/auth/login`. La autenticación es una puerta única para administrador, sin roles. El servidor compara `RESERVAGOL_ADMIN_EMAIL` y `RESERVAGOL_ADMIN_PASSWORD`; al validar, entrega una cookie HMAC firmada con expiración de siete días, `HttpOnly`, `SameSite=Lax`, `Path=/` y `Secure` en producción. `POST /api/auth/logout` la elimina.

Next.js 16 usa `src/proxy.ts`. Las páginas protegidas redirigen a `/login`; las API protegidas devuelven el formato estándar con HTTP 401. Las rutas también deben llamar `exigirSesion()` como primera operación; la ruta `GET /api/reservas/sesion` lo hace y es dinámica.

## Configuración requerida

No se encontraron variables de autenticación en `.env.local` y no se generaron credenciales. Configurar estos nombres en `.env.local` y en los entornos de Vercel antes de iniciar sesión manualmente:

- `RESERVAGOL_ADMIN_EMAIL`
- `RESERVAGOL_ADMIN_PASSWORD`
- `RESERVAGOL_SESSION_SECRET` (mínimo 32 caracteres aleatorios)

Los valores no se registran en Git ni en este checkpoint. `.env.example` documenta los nombres vacíos.

## Verificación

- `npm.cmd test`: 42 pruebas pasaron, incluyendo firma/verificación/expiración de tokens, cookie de login, rechazo de credenciales, proxy y redirects.
- `npm.cmd run build`: exitoso con Next.js 16.3.5; TypeScript y rutas completaron correctamente.
- En `npm run dev`, abrir `/reservas` sin cookie redirigió a `/login`; `GET /api/reservas/sesion` devolvió 401 y `Cache-Control: no-store`; `/` redirigió a `/login`.
- La ruta de login y el paso por proxy con cookie firmada se verificaron con variables efímeras en tests. La sesión manual queda pendiente de configurar los tres nombres indicados arriba.