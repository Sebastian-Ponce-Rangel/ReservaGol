-- Garantiza tarifa por hora para todas las canchas existentes y futuras.
UPDATE canchas SET precio_hora = 60000 WHERE precio_hora IS NULL;

ALTER TABLE canchas ALTER COLUMN precio_hora SET DEFAULT 60000;
ALTER TABLE canchas ALTER COLUMN precio_hora SET NOT NULL;