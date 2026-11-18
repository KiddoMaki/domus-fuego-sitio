import { getPool } from "./db.mjs";

// Catálogo de venta sobre tu esquema DOMUS:
//   item (activo) → item_presentacion (es_venta) → precio_venta (vigente)
// El "id" expuesto a la API es id_presentacion, porque pedido_detalle lo referencia.
export class ProductsRepository {
  async list({ category, q } = {}) {
    const params = [];
    const where = ["i.activo = TRUE", "p.es_venta = TRUE"];
    if (category) { params.push(category); where.push(`c.nombre = $${params.length}`); }
    if (q) { params.push(`%${q}%`); where.push(`i.nombre ILIKE $${params.length}`); }

    const { rows } = await getPool().query(
      `SELECT p.id_presentacion AS id, i.nombre AS name,
              c.nombre AS category, pv.precio,
              p.nombre AS presentacion, 'Unidad' AS unidad
         FROM item_presentacion p
         JOIN item i ON i.id_item = p.id_item
         JOIN categoria_item c ON c.id_categoria = i.id_categoria
         JOIN LATERAL (
           SELECT precio FROM precio_venta
            WHERE id_presentacion = p.id_presentacion
              AND vigente_desde <= now()
              AND (vigente_hasta IS NULL OR vigente_hasta > now())
            ORDER BY vigente_desde DESC LIMIT 1
         ) pv ON TRUE
        WHERE ${where.join(" AND ")}
        ORDER BY c.nombre, i.nombre`,
      params
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await getPool().query(
      `SELECT p.id_presentacion AS id, i.nombre AS name,
              c.nombre AS category, pv.precio,
              p.nombre AS presentacion
         FROM item_presentacion p
         JOIN item i ON i.id_item = p.id_item
         JOIN categoria_item c ON c.id_categoria = i.id_categoria
         JOIN LATERAL (
           SELECT precio FROM precio_venta
            WHERE id_presentacion = p.id_presentacion
              AND vigente_desde <= now()
              AND (vigente_hasta IS NULL OR vigente_hasta > now())
            ORDER BY vigente_desde DESC LIMIT 1
         ) pv ON TRUE
        WHERE p.id_presentacion = $1 AND i.activo = TRUE AND p.es_venta = TRUE`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findByIds(ids) {
    if (!ids.length) return [];
    const { rows } = await getPool().query(
      `SELECT p.id_presentacion AS id, i.nombre AS name, pv.precio
         FROM item_presentacion p
         JOIN item i ON i.id_item = p.id_item
         JOIN LATERAL (
           SELECT precio FROM precio_venta
            WHERE id_presentacion = p.id_presentacion
              AND vigente_desde <= now()
              AND (vigente_hasta IS NULL OR vigente_hasta > now())
            ORDER BY vigente_desde DESC LIMIT 1
         ) pv ON TRUE
        WHERE p.id_presentacion = ANY($1::int[]) AND i.activo = TRUE AND p.es_venta = TRUE`,
      [ids]
    );
    return rows;
  }

  async categories() {
    const { rows } = await getPool().query(
      `SELECT DISTINCT c.nombre AS name
         FROM categoria_item c
         JOIN item i ON i.id_categoria = c.id_categoria
         JOIN item_presentacion p ON p.id_item = i.id_item AND p.es_venta = TRUE
        WHERE i.activo = TRUE
        ORDER BY c.nombre`
    );
    return rows.map((r) => r.name);
  }
}
