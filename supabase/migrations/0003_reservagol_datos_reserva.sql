-- Datos de contacto y método/consentimiento capturados al reservar.

ALTER TABLE clientes
  ADD COLUMN email VARCHAR(254);

ALTER TABLE reservas
  ADD COLUMN metodo_anticipo VARCHAR(20),
  ADD COLUMN privacidad_aceptada_en TIMESTAMPTZ;

ALTER TABLE reservas
  ADD CONSTRAINT reservas_metodo_anticipo_ok
  CHECK (metodo_anticipo IS NULL OR metodo_anticipo IN ('transferencia', 'efectivo'));

CREATE OR REPLACE VIEW v_reservas
WITH (security_invoker = true) AS
SELECT
  r.id,
  r.cancha_id,
  r.cliente_id,
  r.fecha,
  r.hora_inicio,
  r.hora_fin,
  r.valor_total,
  r.estado,
  r.created_at,
  r.updated_at,
  c.nombre AS cancha_nombre,
  cl.nombre AS cliente_nombre,
  cl.contacto AS cliente_contacto,
  COALESCE((SELECT SUM(a.monto) FROM abonos a WHERE a.reserva_id = r.id), 0) AS abonado,
  r.metodo_anticipo
FROM reservas r
JOIN canchas c ON c.id = r.cancha_id
JOIN clientes cl ON cl.id = r.cliente_id;