-- Campos necesarios para mostrar la carta de Domus Fuego desde la API.
-- Se aplica después de DomusDBs.sql.
ALTER TABLE item
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS imagen_url TEXT,
  ADD COLUMN IF NOT EXISTS imagen_alt TEXT,
  ADD COLUMN IF NOT EXISTS orden_visual INTEGER NOT NULL DEFAULT 0;
