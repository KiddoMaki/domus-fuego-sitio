-- =====================================================
-- SEED DEMO — NO ES LA CARTA OFICIAL DE DOMUS FUEGO.
-- Productos, precios, mesas y categorías PROPUESTOS,
-- pendientes de confirmación del propietario (PENDIENTES_NEGOCIO.md).
-- Borrar o actualizar cuando el propietario confirme la carta real.
-- =====================================================
BEGIN;

INSERT INTO unidad_medida (nombre, simbolo, factor_base, tipo_magnitud) VALUES
  ('unidad', 'u', 1, 'conteo'),
  ('gramo', 'g', 1, 'masa'),
  ('kilogramo', 'kg', 1000, 'masa');

INSERT INTO categoria_item (nombre, tipo) VALUES ('Alitas', 'plato');
INSERT INTO categoria_item (nombre, tipo) VALUES ('Papas especiales', 'plato');
INSERT INTO categoria_item (nombre, tipo) VALUES ('Nachos', 'plato');
INSERT INTO categoria_item (nombre, tipo) VALUES ('Hamburguesas', 'plato');
INSERT INTO categoria_item (nombre, tipo) VALUES ('Cortes uruguayos', 'plato');
INSERT INTO categoria_item (nombre, tipo) VALUES ('Parrilladas', 'plato');
INSERT INTO categoria_item (nombre, tipo) VALUES ('Asados individuales', 'plato');
INSERT INTO categoria_item (nombre, tipo) VALUES ('Bebidas soft', 'bebida');
INSERT INTO categoria_item (nombre, tipo) VALUES ('Limonadas', 'bebida');
INSERT INTO categoria_item (nombre, tipo) VALUES ('Jugos naturales', 'bebida');
INSERT INTO categoria_item (nombre, tipo) VALUES ('Cervezas', 'bebida');
INSERT INTO categoria_item (nombre, tipo) VALUES ('Drinks / Cócteles', 'bebida');
INSERT INTO categoria_item (nombre, tipo) VALUES ('Vinos', 'bebida');

-- Alitas BBQ
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Alitas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Alitas BBQ', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.90 FROM p;
-- Alitas Jack Daniels
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Alitas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Alitas Jack Daniels', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 12.90 FROM p;
-- Alitas Honey Mustang
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Alitas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Alitas Honey Mustang', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 20.90 FROM p;
-- Salchipapa
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Papas especiales'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Salchipapa', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 2.50 FROM p;
-- Papas Tex-Mex
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Papas especiales'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Papas Tex-Mex', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.00 FROM p;
-- Papas Cheddar
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Papas especiales'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Papas Cheddar', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.50 FROM p;
-- Nachos Tex-Mex
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Nachos'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Nachos Tex-Mex', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 4.00 FROM p;
-- Nachos Cheese
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Nachos'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Nachos Cheese', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.00 FROM p;
-- Hamburguesa Simple
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Hamburguesas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Hamburguesa Simple', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.00 FROM p;
-- Hamburguesa Cheddar
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Hamburguesas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Hamburguesa Cheddar', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Hamburguesa Bacon
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Hamburguesas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Hamburguesa Bacon', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Hamburguesa Doble
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Hamburguesas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Hamburguesa Doble', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 9.00 FROM p;
-- Picaña
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Cortes uruguayos'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Picaña', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 18.00 FROM p;
-- Colita de cuadril
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Cortes uruguayos'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Colita de cuadril', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 17.00 FROM p;
-- Rib eye
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Cortes uruguayos'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Rib eye', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 18.00 FROM p;
-- Parrillada personal
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Parrilladas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Parrillada personal', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 7.00 FROM p;
-- Parrillada personal completa
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Parrilladas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Parrillada personal completa', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 9.90 FROM p;
-- Parrillada para dos
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Parrilladas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Parrillada para dos', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 18.00 FROM p;
-- Asado de pollo
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Asados individuales'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Asado de pollo', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.50 FROM p;
-- Asado de carne
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Asados individuales'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Asado de carne', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.50 FROM p;
-- Asado de cerdo
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Asados individuales'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Asado de cerdo', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.50 FROM p;
-- Gaseosa
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Bebidas soft'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Gaseosa', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 1.50 FROM p;
-- Té helado
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Bebidas soft'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Té helado', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 1.75 FROM p;
-- Agua mineral
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Bebidas soft'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Agua mineral', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 1.50 FROM p;
-- Agua natural
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Bebidas soft'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Agua natural', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 1.25 FROM p;
-- Limonada de coco
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Limonadas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Limonada de coco', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 2.50 FROM p;
-- Limonada de frutilla
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Limonadas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Limonada de frutilla', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 2.50 FROM p;
-- Limonada de hierbabuena
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Limonadas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Limonada de hierbabuena', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 2.50 FROM p;
-- Limonada imperial
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Limonadas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Limonada imperial', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 2.25 FROM p;
-- Limonada clásica
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Limonadas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Limonada clásica', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 2.00 FROM p;
-- Jugo de mora
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Jugos naturales'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Jugo de mora', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 2.25 FROM p;
-- Jugo de frutilla
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Jugos naturales'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Jugo de frutilla', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 2.25 FROM p;
-- Jugo de guanábana
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Jugos naturales'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Jugo de guanábana', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 2.25 FROM p;
-- Jugo de maracuyá
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Jugos naturales'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Jugo de maracuyá', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 2.25 FROM p;
-- Pilsener litro
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Cervezas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Pilsener litro', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 4.50 FROM p;
-- Club litro
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Cervezas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Club litro', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.00 FROM p;
-- 3 Pilsener de litro
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Cervezas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT '3 Pilsener de litro', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 12.00 FROM p;
-- 3 Club de litro
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Cervezas'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT '3 Club de litro', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 13.50 FROM p;
-- Moscow Mule
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Moscow Mule', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Destornillador (Screwdriver)
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Destornillador (Screwdriver)', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.00 FROM p;
-- Vodka Tonic
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Vodka Tonic', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.00 FROM p;
-- Mojito
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Mojito', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Cuba Libre
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Cuba Libre', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.00 FROM p;
-- Piña Colada
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Piña Colada', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Margarita
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Margarita', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.00 FROM p;
-- Tequila Sunrise
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Tequila Sunrise', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Paloma
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Paloma', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Gin Tonic
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Gin Tonic', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.00 FROM p;
-- Tom Collins
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Tom Collins', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Gin Fizz
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Gin Fizz', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Whisky Sour
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Whisky Sour', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Whisky Americano
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Whisky Americano', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.00 FROM p;
-- Highball
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Highball', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Padrino
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Drinks / Cócteles'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Padrino', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Sangría (copa)
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Vinos'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Sangría (copa)', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 6.00 FROM p;
-- Sangría (jarra)
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Vinos'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Sangría (jarra)', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 18.00 FROM p;
-- Tinto de verano
WITH c AS (SELECT id_categoria FROM categoria_item WHERE nombre = 'Vinos'),
u AS (SELECT id_unidad FROM unidad_medida WHERE nombre = 'unidad'),
i AS (INSERT INTO item (nombre, id_categoria, tipo_item, id_unidad_base, maneja_lote, perecedero, stock_minimo, activo)
      SELECT 'Tinto de verano', c.id_categoria, 'venta', u.id_unidad, FALSE, FALSE, 0, TRUE FROM c, u
      RETURNING id_item),
p AS (INSERT INTO item_presentacion (id_item, nombre, id_unidad, factor_unidad, es_venta, es_compra)
      SELECT i.id_item, 'Unidad', (SELECT id_unidad FROM unidad_medida WHERE nombre='unidad'), 1, TRUE, FALSE FROM i
      RETURNING id_presentacion)
INSERT INTO precio_venta (id_presentacion, precio) SELECT id_presentacion, 5.00 FROM p;

INSERT INTO mesa (numero, capacidad, ubicacion) VALUES
  ('1', 2, 'Salón principal'), ('2', 2, 'Salón principal'), ('3', 4, 'Salón principal'),
  ('4', 4, 'Salón principal'), ('5', 6, 'Terraza'), ('6', 6, 'Terraza'),
  ('7', 8, 'Sala VIP'), ('8', 10, 'Sala VIP');

COMMIT;

