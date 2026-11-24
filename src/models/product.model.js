// MODELO de la tabla de productos (catálogo DOMUS):
// item -> item_presentacion -> precio_venta (vigente) + categoria_item.
// Toda consulta se construye con Drizzle (ORM); el id público es id_presentacion.
import { and, asc, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { getDb } from "../database/connection.js";
import {
  categoriaItem,
  item,
  itemPresentacion,
  precioVenta,
} from "../database/schema.js";

const precioVigente = sql`(SELECT ${precioVenta.precio}
  FROM ${precioVenta}
  WHERE ${precioVenta.idPresentacion} = ${itemPresentacion.idPresentacion}
    AND ${precioVenta.vigenteDesde} <= now()
    AND (${precioVenta.vigenteHasta} IS NULL OR ${precioVenta.vigenteHasta} > now())
  ORDER BY ${precioVenta.vigenteDesde} DESC
  LIMIT 1)`.mapWith(Number);

const columns = {
  id: itemPresentacion.idPresentacion,
  name: item.nombre,
  category: categoriaItem.nombre,
  price: precioVigente,
  description: item.descripcion,
  image: item.imagenUrl,
  imageAlt: item.imagenAlt,
  presentacion: itemPresentacion.nombre,
  unidad: sql`'Unidad'`.as("unidad"),
};

function catalogQuery(filters = {}) {
  const conditions = [
    eq(item.activo, true),
    eq(itemPresentacion.esVenta, true),
  ];
  if (filters.category) conditions.push(eq(categoriaItem.nombre, filters.category));
  if (filters.q) conditions.push(ilike(item.nombre, `%${filters.q}%`));

  return getDb()
    .select(columns)
    .from(itemPresentacion)
    .innerJoin(item, eq(item.idItem, itemPresentacion.idItem))
    .innerJoin(categoriaItem, eq(categoriaItem.idCategoria, item.idCategoria))
    .where(and(...conditions))
    .orderBy(asc(categoriaItem.nombre), asc(item.ordenVisual), asc(item.nombre));
}

export const productModel = {
  async list({ category, q, page = 1, limit = 50 } = {}) {
    const query = catalogQuery({ category, q });
    if (!limit) return query;
    return query.limit(limit).offset((page - 1) * limit);
  },

  async count({ category, q } = {}) {
    const conditions = [eq(item.activo, true), eq(itemPresentacion.esVenta, true)];
    if (category) conditions.push(eq(categoriaItem.nombre, category));
    if (q) conditions.push(ilike(item.nombre, `%${q}%`));

    const [{ total }] = await getDb()
      .select({ total: sql`count(*)`.mapWith(Number) })
      .from(itemPresentacion)
      .innerJoin(item, eq(item.idItem, itemPresentacion.idItem))
      .innerJoin(categoriaItem, eq(categoriaItem.idCategoria, item.idCategoria))
      .where(and(...conditions));
    return total;
  },

  async findById(id) {
    const [product] = await catalogQuery().where(
      and(
        eq(item.activo, true),
        eq(itemPresentacion.esVenta, true),
        eq(itemPresentacion.idPresentacion, id)
      )
    );
    return product ?? null;
  },

  async findByIds(ids) {
    if (!ids.length) return [];
    return getDb()
      .select({
        id: itemPresentacion.idPresentacion,
        name: item.nombre,
        precio: precioVigente,
      })
      .from(itemPresentacion)
      .innerJoin(item, eq(item.idItem, itemPresentacion.idItem))
      .where(
        and(
          eq(item.activo, true),
          eq(itemPresentacion.esVenta, true),
          inArray(itemPresentacion.idPresentacion, ids)
        )
      );
  },

  async categories() {
    const rows = await getDb()
      .selectDistinct({ name: categoriaItem.nombre })
      .from(categoriaItem)
      .innerJoin(item, eq(item.idCategoria, categoriaItem.idCategoria))
      .innerJoin(
        itemPresentacion,
        and(
          eq(itemPresentacion.idItem, item.idItem),
          eq(itemPresentacion.esVenta, true)
        )
      )
      .where(eq(item.activo, true))
      .orderBy(asc(categoriaItem.nombre));
    return rows.map((row) => row.name);
  },
};
