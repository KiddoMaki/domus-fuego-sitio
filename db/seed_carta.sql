-- Datos iniciales de la carta de Domus Fuego.
-- Idempotente: se puede volver a ejecutar sin duplicar registros.
INSERT INTO unidad_medida (id_unidad, nombre, simbolo, factor_base, tipo_magnitud)
VALUES (1, 'Unidad', 'und', 1, 'cantidad')
ON CONFLICT (id_unidad) DO NOTHING;

INSERT INTO categoria_item (id_categoria, nombre, tipo)
VALUES
  (1, 'Cortes', 'venta'),
  (2, 'Parrilla', 'venta'),
  (3, 'Hamburguesas', 'venta'),
  (4, 'Para compartir', 'venta'),
  (5, 'Bebidas', 'venta')
ON CONFLICT (id_categoria) DO NOTHING;

INSERT INTO item (id_item, nombre, id_categoria, tipo_item, id_unidad_base, descripcion, imagen_url, imagen_alt, orden_visual)
VALUES
  (1, 'Picaña a la leña', 1, 'producto', 1, 'Picaña uruguaya de 250 g, ensalada fresca y papas a elección.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80', 'Picaña asada a la parrilla con guarnición', 1),
  (2, 'Rib eye', 1, 'producto', 1, 'Corte uruguayo de 250 g, ensalada fresca y papas a elección.', 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80', 'Rib eye sellado al fuego', 2),
  (3, 'Colita de cuadril', 1, 'producto', 1, 'Corte uruguayo de 250 g, ensalada fresca y papas a elección.', 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=900&q=80', 'Carne a la parrilla servida con vegetales', 3),
  (4, 'Parrillada personal', 2, 'producto', 1, 'Pollo, chuleta de lomo, chorizo, morcilla, ensalada y papas.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80', 'Selección de carnes variadas a la parrilla', 4),
  (5, 'Parrillada para dos', 2, 'producto', 1, 'Pollo, lomo, carne, chorizo, morcilla, ensalada grande y papas.', 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80', 'Parrillada abundante para compartir', 5),
  (6, 'Hamburguesa Bacon', 3, 'producto', 1, 'Res, lechuga, tomate, queso holandés y bacon. Incluye papas fritas.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80', 'Hamburguesa con bacon, queso y vegetales', 6),
  (7, 'Alitas BBQ', 4, 'producto', 1, 'Seis alitas con bastones de vegetales, salsa ranch y papas fritas.', 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=900&q=80', 'Alitas de pollo glaseadas con salsa BBQ', 7),
  (8, 'Limonada de coco', 5, 'producto', 1, 'Limonada fresca preparada con coco.', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80', 'Bebida fría con limón y hojas frescas', 8)
ON CONFLICT (id_item) DO NOTHING;

INSERT INTO item_presentacion (id_presentacion, id_item, nombre, id_unidad, factor_unidad, es_venta)
VALUES
  (1, 1, 'Porción 250 g', 1, 1, true),
  (2, 2, 'Porción 250 g', 1, 1, true),
  (3, 3, 'Porción 250 g', 1, 1, true),
  (4, 4, 'Porción individual', 1, 1, true),
  (5, 5, 'Para dos', 1, 1, true),
  (6, 6, 'Unidad', 1, 1, true),
  (7, 7, 'Seis alitas', 1, 1, true),
  (8, 8, 'Vaso', 1, 1, true)
ON CONFLICT (id_presentacion) DO NOTHING;

INSERT INTO precio_venta (id_precio, id_presentacion, precio, vigente_desde, vigente_hasta)
VALUES
  (1, 1, 18, now(), NULL),
  (2, 2, 18, now(), NULL),
  (3, 3, 17, now(), NULL),
  (4, 4, 7, now(), NULL),
  (5, 5, 18, now(), NULL),
  (6, 6, 6, now(), NULL),
  (7, 7, 6.9, now(), NULL),
  (8, 8, 2.5, now(), NULL)
ON CONFLICT (id_precio) DO NOTHING;

-- Mesas y clientes base para la futura parte de reservas.
INSERT INTO mesa (id_mesa, numero, capacidad, ubicacion)
VALUES
  (1, 'M1', 2, 'Salón'),
  (2, 'M2', 2, 'Salón'),
  (3, 'M3', 4, 'Salón'),
  (4, 'M4', 4, 'Terraza'),
  (5, 'M5', 6, 'Terraza'),
  (6, 'M6', 8, 'Parrilla')
ON CONFLICT (id_mesa) DO NOTHING;

INSERT INTO cliente (id_cliente, nombre, telefono, email)
VALUES
  (1, 'Cliente mostrador', '0970000000', 'mostrador@domusfuego.local'),
  (2, 'Cliente demo', '0980000000', 'demo@domusfuego.local')
ON CONFLICT (id_cliente) DO NOTHING;

SELECT setval(pg_get_serial_sequence('item', 'id_item'), 8, true);
SELECT setval(pg_get_serial_sequence('item_presentacion', 'id_presentacion'), 8, true);
SELECT setval(pg_get_serial_sequence('precio_venta', 'id_precio'), 8, true);
SELECT setval(pg_get_serial_sequence('mesa', 'id_mesa'), 6, true);
SELECT setval(pg_get_serial_sequence('cliente', 'id_cliente'), 2, true);
