-- M2: vista con abonado y estado de pago derivado, y cierre de acceso público

CREATE OR REPLACE VIEW v_reservas
WITH (security_invoker = true) AS
SELECT
  r.*,
  c.nombre  AS cancha_nombre,
  cl.nombre AS cliente_nombre,
  cl.contacto AS cliente_contacto,
  COALESCE((SELECT SUM(a.monto) FROM abonos a WHERE a.reserva_id = r.id), 0) AS abonado
FROM reservas r
JOIN canchas c   ON c.id = r.cancha_id
JOIN clientes cl ON cl.id = r.cliente_id;

ALTER TABLE canchas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonos   ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON canchas, clientes, reservas, abonos FROM anon, authenticated;
REVOKE ALL ON v_reservas FROM anon, authenticated;