# P06 completado · Interfaz base, canchas y clientes

P06 deja lista la base visual y la gestión de entidades. La fase 5 sigue abierta hasta P07 y P08.

## Interfaz

- Se creó un shell autenticado con navegación a Agenda, Canchas y Clientes, correo de la sesión y cierre de sesión.
- Componentes propios reutilizables: `Boton`, `Campo`, `Selector`, `Tarjeta`, `Insignia`, `Aviso`, `Modal` y `EstadoVacio`. No se añadieron dependencias visuales.
- Se conserva la paleta forestal existente, con estilos responsive, foco visible, etiquetas accesibles y estados que comunican texto además de color.
- La agenda lista reservas activas reales con fecha, horario, cancha, cliente, monto y estado derivado del pago.

## Canchas y clientes

- Crear, listar, indicar estado activo/inactivo y desactivar preservando el historial.
- Cancha duplicada responde con su mensaje de negocio.
- Las acciones de desactivación usan rutas protegidas y diálogo nativo con gestión de foco/Escape.

## Smoke visual y funcional

- Sesión efímera en Next dev; las pantallas `/reservas`, `/reservas/canchas` y `/reservas/clientes` cargaron con los datos Demo.
- Alta de cancha `Prueba P06 Cancha`: correcta. Repetir el nombre: rechazado con “Ya existe una cancha con ese nombre.”
- Desactivación de cancha: el registro se conservó como Inactiva.
- Alta y desactivación de cliente: correctas; el registro permanece en la lista como Inactivo.
- Se eliminaron los registros `Prueba P06` tras el smoke. Datos Demo intactos.
- A 390 px de ancho, el documento tuvo 375 px de scroll width, sin desbordamiento horizontal.

## Verificaciones

- `npm.cmd test`: 42 pruebas pasaron.
- `npm.cmd run build`: compilación, TypeScript y rutas completados sin errores.