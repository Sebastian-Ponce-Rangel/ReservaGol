-- M1: tablas de ReservaGol

CREATE TABLE IF NOT EXISTS canchas (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(100)  NOT NULL,
  precio_hora INTEGER,                                 -- opcional; pesos enteros
  activa      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT canchas_nombre_minimo CHECK (char_length(btrim(nombre)) >= 1),
  CONSTRAINT canchas_precio_ok CHECK (precio_hora IS NULL OR precio_hora > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_canchas_nombre ON canchas (lower(btrim(nombre)));

CREATE TABLE IF NOT EXISTS clientes (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(120)  NOT NULL,
  contacto    VARCHAR(120)  NOT NULL,
  activo      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT clientes_nombre_minimo   CHECK (char_length(btrim(nombre)) >= 1),
  CONSTRAINT clientes_contacto_minimo CHECK (char_length(btrim(contacto)) >= 1)
);

CREATE TABLE IF NOT EXISTS reservas (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cancha_id    UUID          NOT NULL REFERENCES canchas(id) ON DELETE RESTRICT,
  cliente_id   UUID          NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  fecha        DATE          NOT NULL,
  hora_inicio  TIME          NOT NULL,
  hora_fin     TIME          NOT NULL,
  valor_total  INTEGER       NOT NULL,
  estado       VARCHAR(10)   NOT NULL DEFAULT 'activa',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT reservas_horas_ok    CHECK (hora_fin > hora_inicio),
  CONSTRAINT reservas_valor_ok    CHECK (valor_total > 0),
  CONSTRAINT reservas_estado_ok   CHECK (estado IN ('activa', 'cancelada'))
);
CREATE INDEX IF NOT EXISTS idx_reservas_cancha_fecha ON reservas (cancha_id, fecha, estado);
CREATE INDEX IF NOT EXISTS idx_reservas_cliente ON reservas (cliente_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_reservas_slot_activo
  ON reservas (cancha_id, fecha, hora_inicio) WHERE estado = 'activa';

CREATE TABLE IF NOT EXISTS abonos (
  id          BIGSERIAL     PRIMARY KEY,
  reserva_id  UUID          NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  monto       INTEGER       NOT NULL,
  fecha       DATE          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT abonos_monto_positivo CHECK (monto > 0)
);
CREATE INDEX IF NOT EXISTS idx_abonos_reserva ON abonos (reserva_id);

CREATE OR REPLACE FUNCTION reservagol_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservas_updated_at ON reservas;
CREATE TRIGGER trg_reservas_updated_at BEFORE UPDATE ON reservas
  FOR EACH ROW EXECUTE FUNCTION reservagol_actualizar_updated_at();