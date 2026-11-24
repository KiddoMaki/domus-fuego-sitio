// MODELO administrativo: consultas transversales y acceso genérico a las tablas
// del esquema DOMUS. Los identificadores se escapan con sql.identifier y los
// valores siempre van como parámetros; las tablas permitidas están en un listado.
import { asc, desc, eq, sql } from "drizzle-orm";

const countOf = (table, where = "") =>
  sql.raw(`(select count(*) from ${table}${where ? ` where ${where}` : ""})`).mapWith(Number);
const sumOf = (table, column, where = "") =>
  sql.raw(`(select coalesce(sum(${column}), 0) from ${table}${where ? ` where ${where}` : ""})`).mapWith(Number);
import { getDb } from "../database/connection.js";
import {
  categoriaItem,
  cliente,
  item,
  itemPresentacion,
  mesa,
  pedido,
  reserva,
  usuarios,
} from "../database/schema.js";

const PK = Object.freeze({
  caja_sesion: "id_caja_sesion",
  categoria_gasto: "id_categoria_gasto",
  categoria_item: "id_categoria",
  cliente: "id_cliente",
  costo_receta: "id_costo_receta",
  costo_receta_detalle: "id_costo_receta_detalle",
  gasto_operativo: "id_gasto",
  item: "id_item",
  item_presentacion: "id_presentacion",
  item_proveedor: "id_item_proveedor",
  lote_inventario: "id_lote",
  merma: "id_merma",
  mesa: "id_mesa",
  movimiento_contable: "id_movimiento_contable",
  movimiento_inventario: "id_movimiento",
  orden_compra: "id_orden_compra",
  orden_compra_detalle: "id_oc_detalle",
  orden_produccion: "id_orden_produccion",
  orden_produccion_detalle: "id_op_detalle",
  pago: "id_pago",
  pedido: "id_pedido",
  pedido_detalle: "id_pedido_detalle",
  precio_venta: "id_precio",
  proveedor: "id_proveedor",
  recepcion: "id_recepcion",
  recepcion_detalle: "id_recepcion_detalle",
  receta: "id_receta",
  receta_detalle: "id_receta_detalle",
  reserva: "id_reserva",
  reserva_detalle: "id_reserva_detalle",
  roles: "id_rol",
  rolesxusuario: "id_rolxusuario",
  tipo_movimiento: "id_tipo_movimiento",
  tipo_movimiento_contable: "id_tipo_movimiento_contable",
  unidad_medida: "id_unidad",
  usuario: "id_usuario",
  usuarios: "id_usuario",
  venta: "id_venta",
});

export const ADMIN_TABLES = Object.freeze(PK);

// Columnas que el panel solo muestra (las calcula la base de datos).
const COMPUTED_COLUMNS = new Set([
  "factor_compra", "factor_venta", "created_at", "updated_at", "fecha_calculo",
]);
// Nunca se editan desde el formulario genérico (se gestionan en /api/auth).
const HIDDEN_COLUMNS = new Set(["password_hash"]);
const LABEL_PRIORITY = [
  "nombre", "name", "descripcion", "concepto", "codigo_lote", "codigo",
  "numero", "email", "simbolo", "detalle", "motivo", "tipo", "observaciones",
];

function assertTable(table) {
  if (!Object.hasOwn(PK, table)) throw new Error("Tabla no permitida");
  return PK[table];
}

const resultRows = (result) => result?.rows ?? result ?? [];

async function columnsOf(table) {
  const result = await getDb().execute(sql`
    select column_name as name,
           data_type as type,
           is_nullable as nullable,
           column_default as "default",
           coalesce(identity_generation, '') as identity
    from information_schema.columns
    where table_schema = 'public' and table_name = ${table}
    order by ordinal_position
  `);
  return resultRows(result);
}

// Llaves foráneas reales de la tabla, una por columna (las FK compuestas se deduplican).
async function foreignKeysOf(table) {
  const result = await getDb().execute(sql`
    select a.attname as "column",
           co.confrelid::regclass::text as "refTable",
           ca.attname as "refColumn"
    from pg_constraint co
    join pg_attribute a on a.attrelid = co.conrelid and a.attnum = any(co.conkey)
    join pg_attribute ca on ca.attrelid = co.confrelid and ca.attnum = any(co.confkey)
    where co.contype = 'f'
      and co.connamespace = 'public'::regnamespace
      and co.conrelid = (
        select oid from pg_class
        where relname = ${table} and relnamespace = 'public'::regnamespace
      )
    order by a.attname
  `);
  const score = (fk) => {
    const expected = fk.column.replace(/^id_/, "");
    let points = 0;
    if (fk.refTable === expected) points += 5;
    if (fk.refTable === `${expected}s`) points += 2;
    if (PK[fk.refTable] === fk.refColumn) points += 3;
    return points;
  };
  const found = new Map();
  for (const fk of resultRows(result)) {
    const current = found.get(fk.column);
    if (!current || score(fk) > score(current)) found.set(fk.column, fk);
  }
  return found;
}

// Opciones legibles para un combobox: valor = llave foránea, etiqueta = columna descriptiva.
async function optionsOf(refTable, refColumn, labelColumn) {
  const label = labelColumn ? sql.identifier(labelColumn) : sql`${sql.identifier(refColumn)}::text`;
  const result = await getDb().execute(sql`
    select ${sql.identifier(refColumn)} as value, ${label} as label
    from ${sql.identifier(refTable)}
    where ${label} is not null
    order by ${label}
    limit 200
  `);
  return resultRows(result).map((row) => ({
    value: Number(row.value),
    label: row.label == null || row.label === "" ? `${refTable} #${row.value}` : String(row.label),
  }));
}

// Se usan alias reales para que la subconsulta esté correlacionada con la tabla
// externa item_presentacion (Drizzle no califica columnas dentro de sql``).
const precioVigente = sql`(SELECT pv.precio
  FROM precio_venta pv
  WHERE pv.id_presentacion = item_presentacion.id_presentacion
    AND pv.vigente_desde <= now()
    AND (pv.vigente_hasta IS NULL OR pv.vigente_hasta > now())
  ORDER BY pv.vigente_desde DESC LIMIT 1)`.mapWith(Number);

export const adminModel = {
  tables() {
    return Object.entries(PK).map(([table, pk]) => ({ table, pk }));
  },

  async schema(table) {
    assertTable(table);
    const [columns, foreignKeys] = await Promise.all([
      columnsOf(table), foreignKeysOf(table),
    ]);
    const refColumns = new Map();
    const enriched = [];
    for (const column of columns) {
      const fk = foreignKeys.get(column.name);
      let reference = null;
      if (fk) {
        if (!refColumns.has(fk.refTable)) {
          refColumns.set(fk.refTable, (await columnsOf(fk.refTable)).map((c) => c.name));
        }
        const labelColumn = LABEL_PRIORITY.find((name) => refColumns.get(fk.refTable).includes(name)) ?? null;
        reference = {
          table: fk.refTable,
          column: fk.refColumn,
          labelColumn,
          options: await optionsOf(fk.refTable, fk.refColumn, labelColumn),
        };
      }
      enriched.push({
        ...column,
        editable: !column.identity && column.name !== PK[table] && !HIDDEN_COLUMNS.has(column.name),
        computed: COMPUTED_COLUMNS.has(column.name),
        ...(reference ? { reference } : {}),
      });
    }
    return { table, pk: PK[table], columns: enriched };
  },

  async itemUnidades() {
    const result = await getDb().execute(sql`select * from vw_item_unidades order by id_item`);
    return resultRows(result);
  },

  async list(table, limit = 100) {
    const pk = assertTable(table);
    const result = await getDb().execute(
      sql`select * from ${sql.identifier(table)} order by ${sql.identifier(pk)} desc limit ${limit}`
    );
    return resultRows(result);
  },

  async find(table, id) {
    const pk = assertTable(table);
    const result = await getDb().execute(sql`
      select * from ${sql.identifier(table)}
      where ${sql.identifier(pk)} = ${Number(id)} limit 1
    `);
    return resultRows(result)[0] ?? null;
  },

  async create(table, values) {
    const pk = assertTable(table);
    const metadata = await columnsOf(table);
    const allowed = new Set(metadata
      .filter((c) => !c.identity && !COMPUTED_COLUMNS.has(c.name) && !HIDDEN_COLUMNS.has(c.name))
      .map((c) => c.name));
    const entries = Object.entries(values ?? {}).filter(
      ([key, value]) => allowed.has(key) && value !== "" && value !== null && value !== undefined
    );
    if (!entries.length) throw new Error("No hay campos válidos para crear el registro");

    const names = sql.join(entries.map(([key]) => sql.identifier(key)), sql`, `);
    const vals = sql.join(entries.map(([, value]) => sql`${value}`), sql`, `);
    const result = await getDb().execute(sql`
      insert into ${sql.identifier(table)} (${names}) values (${vals}) returning *
    `);
    return resultRows(result)[0] ?? { pk };
  },

  async update(table, id, values) {
    const pk = assertTable(table);
    const metadata = await columnsOf(table);
    const allowed = new Set(metadata
      .filter((c) => c.name !== pk && !COMPUTED_COLUMNS.has(c.name) && !HIDDEN_COLUMNS.has(c.name))
      .map((c) => c.name));
    const entries = Object.entries(values ?? {}).filter(([key, value]) => allowed.has(key));
    if (!entries.length) throw new Error("No hay campos válidos para actualizar");

    const sets = sql.join(
      entries.map(([key, value]) => sql`${sql.identifier(key)} = ${value}`),
      sql`, `
    );
    const result = await getDb().execute(sql`
      update ${sql.identifier(table)} set ${sets}
      where ${sql.identifier(pk)} = ${Number(id)} returning *
    `);
    if (!resultRows(result).length) throw new Error("Registro no encontrado");
    return resultRows(result)[0];
  },

  async remove(table, id) {
    const pk = assertTable(table);
    const db = getDb();
    // Los ítems se desactivan para no romper el histórico de pedidos.
    if (table === "item") {
      await db.update(item).set({ activo: false }).where(eq(item.idItem, Number(id)));
      return { id: Number(id), desactivado: true };
    }
    const result = await db.execute(sql`
      delete from ${sql.identifier(table)} where ${sql.identifier(pk)} = ${Number(id)} returning *
    `);
    if (!resultRows(result).length) throw new Error("Registro no encontrado");
    return { id: Number(id), eliminado: true };
  },

  async overview() {
    const [row] = await getDb()
      .select({
        items: sql` (select count(*) from ${item}) `.mapWith(Number),
        categories: sql` (select count(*) from ${categoriaItem}) `.mapWith(Number),
        clients: sql` (select count(*) from ${cliente}) `.mapWith(Number),
        tables: sql` (select count(*) from ${mesa}) `.mapWith(Number),
        reservations: sql` (select count(*) from ${reserva}) `.mapWith(Number),
        activeReservations: sql` (select count(*) from ${reserva} where ${reserva.fecha} >= current_date and ${reserva.estado} in ('pendiente','confirmada')) `.mapWith(Number),
        orders: sql` (select count(*) from ${pedido}) `.mapWith(Number),
        users: sql` (select count(*) from ${usuarios}) `.mapWith(Number),
        suppliers: countOf("proveedor"),
        purchaseOrders: countOf("orden_compra"),
        receipts: countOf("recepcion"),
        lots: countOf("lote_inventario"),
        lotsExpiring: countOf("lote_inventario", "fecha_vencimiento between current_date and current_date + 7"),
        stockMovements: countOf("movimiento_inventario"),
        waste: countOf("merma"),
        recipes: countOf("receta"),
        productionOrders: countOf("orden_produccion"),
        activeProduction: countOf("orden_produccion", "estado in ('planificada','en_proceso')"),
        openCash: countOf("caja_sesion", "estado = 'abierta'"),
        sales: countOf("venta"),
        salesTotal: sumOf("pago", "monto", "estado = 'aprobado'"),
        expenses: countOf("gasto_operativo"),
        expensesTotal: sumOf("gasto_operativo", "monto"),
        payments: countOf("pago"),
        accountingEntries: countOf("movimiento_contable"),
        schemaTables: sql.raw("(select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE')").mapWith(Number),
        schemaViews: sql.raw("(select count(*) from information_schema.tables where table_schema='public' and table_type='VIEW')").mapWith(Number),
        schemaFks: sql.raw("(select count(*) from information_schema.table_constraints where table_schema='public' and constraint_type='FOREIGN KEY')").mapWith(Number),
      })
      .from(sql`(select 1) as x`);
    return row;
  },

  // Consultas de módulo: SQL con alias explícitos para evitar ambigüedades.
  async inventory() {
    const result = await getDb().execute(sql.raw(`
      select l.id_lote, l.codigo_lote, i.id_item, i.nombre as item, c.nombre as categoria,
             i.politica_consumo, l.cantidad_inicial, um.simbolo as unidad,
             l.costo_unitario, (l.cantidad_inicial * l.costo_unitario) as valorizado,
             l.fecha_vencimiento, l.estado,
             case when l.id_recepcion_detalle is not null then 'Compra'
                  when l.id_orden_produccion is not null then 'Producción'
                  else '—' end as origen
      from lote_inventario l
      join item i on i.id_item = l.id_item
      left join categoria_item c on c.id_categoria = i.id_categoria
      left join unidad_medida um on um.id_unidad = l.id_unidad
      order by l.fecha_vencimiento nulls last, l.id_lote desc
    `));
    return resultRows(result);
  },

  async purchases() {
    const result = await getDb().execute(sql.raw(`
      select oc.id_orden_compra, p.nombre as proveedor, oc.fecha_emision, oc.estado,
             coalesce(det.lineas, 0)::int as lineas,
             coalesce(det.total, 0) as total,
             count(distinct r.id_recepcion)::int as recepciones,
             oc.observaciones
      from orden_compra oc
      join proveedor p on p.id_proveedor = oc.id_proveedor
      left join (
        select id_orden_compra, count(*)::int as lineas,
               sum(cantidad_solicitada * precio_pactado) as total
        from orden_compra_detalle
        group by id_orden_compra
      ) det on det.id_orden_compra = oc.id_orden_compra
      left join recepcion r on r.id_orden_compra = oc.id_orden_compra
      group by oc.id_orden_compra, p.nombre, oc.fecha_emision, oc.estado,
               oc.observaciones, det.lineas, det.total
      order by oc.fecha_emision desc
    `));
    return resultRows(result);
  },

  async production() {
    const result = await getDb().execute(sql.raw(`
      select op.id_orden_produccion, r.nombre as receta, op.tipo, op.estado,
             r.rendimiento, op.rendimiento_real, op.fecha_planificada, op.fecha_ejecucion,
             coalesce((
               select sum(crd.cantidad * crd.costo_unitario)
               from costo_receta cr
               join costo_receta_detalle crd on crd.id_costo_receta = cr.id_costo_receta
               where cr.id_receta = r.id_receta
             ), 0) as costo_total,
             coalesce((select avg(rd.merma_esperada_pct) from receta_detalle rd
                       where rd.id_receta = r.id_receta), 0) as merma_estimada,
             op.observaciones
      from orden_produccion op
      join receta r on r.id_receta = op.id_receta
      order by op.fecha_planificada desc nulls last, op.id_orden_produccion desc
    `));
    return resultRows(result);
  },

  async finance() {
    const result = await getDb().execute(sql.raw(`
      select mc.id_movimiento_contable, t.nombre as tipo, t.signo, mc.monto, mc.fecha,
             coalesce('Venta #' || v.id_venta, 'Gasto: ' || g.concepto,
                      'Costo receta #' || cr.id_costo_receta, '—') as detalle
      from movimiento_contable mc
      join tipo_movimiento_contable t on t.id_tipo_movimiento_contable = mc.id_tipo_movimiento_contable
      left join venta v on v.id_venta = mc.id_venta
      left join gasto_operativo g on g.id_gasto = mc.id_gasto
      left join costo_receta cr on cr.id_costo_receta = mc.id_costo_receta
      order by mc.fecha desc, mc.id_movimiento_contable desc
    `));
    return resultRows(result);
  },

  async logs(limit = 50) {
    const result = await getDb().execute(sql`
      select id_auditoria_log, fecha, usuario, modulo, accion, detalle, ip
      from auditoria_log
      order by fecha desc, id_auditoria_log desc
      limit ${Math.min(Math.max(Number(limit) || 50, 1), 200)}
    `);
    return resultRows(result);
  },

  async log({ actor, modulo, accion, detalle, ip }) {
    await getDb().execute(sql`
      insert into auditoria_log (usuario, modulo, accion, detalle, ip)
      values (${String(actor ?? "Administrador").slice(0, 120)},
              ${String(modulo ?? "general").slice(0, 80)},
              ${String(accion ?? "acción").slice(0, 80)},
              ${detalle == null ? null : String(detalle).slice(0, 2000)},
              ${ip == null ? null : String(ip).slice(0, 64)})
    `);
  },

  async audit() {
    const result = await getDb().execute(sql.raw(`
      select
        (select count(*) from information_schema.tables
          where table_schema='public' and table_type='BASE TABLE') as tablas,
        (select count(*) from information_schema.table_constraints
          where table_schema='public' and constraint_type='FOREIGN KEY') as foraneas,
        (select count(*) from information_schema.tables
          where table_schema='public' and table_type='VIEW') as vistas,
        (select coalesce(sum(n_live_tup), 0) from pg_stat_user_tables) as registros,
        now() as actualizado
    `));
    return resultRows(result)[0] ?? null;
  },

  async cash() {
    const result = await getDb().execute(sql.raw(`
      select id_caja_sesion, fecha_apertura, fecha_cierre, monto_apertura,
             monto_cierre, estado
      from caja_sesion order by fecha_apertura desc
    `));
    return resultRows(result);
  },

  async sales() {
    const result = await getDb().execute(sql.raw(`
      select v.id_venta, v.id_pedido, v.fecha_venta, v.estado, cs.id_caja_sesion,
             coalesce((select string_agg(distinct pa.medio, ', ' order by pa.medio)
                       from pago pa where pa.id_venta = v.id_venta), '—') as medios,
             coalesce(sum(pd.cantidad * pd.precio_unitario), 0) as total,
             coalesce((select sum(pa.monto) from pago pa
                       where pa.id_venta = v.id_venta and pa.estado = 'aprobado'), 0) as cobrado
      from venta v
      join pedido pe on pe.id_pedido = v.id_pedido
      join caja_sesion cs on cs.id_caja_sesion = v.id_caja_sesion
      left join pedido_detalle pd on pd.id_pedido = pe.id_pedido
      group by v.id_venta, v.id_pedido, v.fecha_venta, v.estado, cs.id_caja_sesion
      order by v.fecha_venta desc
    `));
    return resultRows(result);
  },

  async catalog() {
    return getDb()
      .select({
        id: item.idItem,
        name: item.nombre,
        category: categoriaItem.nombre,
        idCategoria: item.idCategoria,
        price: precioVigente,
        active: item.activo,
        description: item.descripcion,
        image: item.imagenUrl,
        presentation: itemPresentacion.nombre,
        idPresentacion: itemPresentacion.idPresentacion,
        orden: item.ordenVisual,
      })
      .from(item)
      .innerJoin(categoriaItem, eq(categoriaItem.idCategoria, item.idCategoria))
      .leftJoin(itemPresentacion, eq(itemPresentacion.idItem, item.idItem))
      .orderBy(asc(categoriaItem.nombre), asc(item.ordenVisual), asc(item.nombre));
  },

  async reservations() {
    return getDb()
      .select({
        id: reserva.idReserva,
        fecha: reserva.fecha,
        hora: reserva.hora,
        comensales: reserva.cantidadComensales,
        estado: reserva.estado,
        observaciones: reserva.observaciones,
        mesa: mesa.numero,
        idMesa: reserva.idMesa,
        cliente: cliente.nombre,
        idCliente: reserva.idCliente,
        telefono: cliente.telefono,
        email: cliente.email,
      })
      .from(reserva)
      .innerJoin(mesa, eq(mesa.idMesa, reserva.idMesa))
      .innerJoin(cliente, eq(cliente.idCliente, reserva.idCliente))
      .orderBy(desc(reserva.fecha), desc(reserva.hora));
  },

  async setReservationStatus(id, estado) {
    const [row] = await getDb()
      .update(reserva)
      .set({ estado })
      .where(eq(reserva.idReserva, Number(id)))
      .returning({ id: reserva.idReserva, estado: reserva.estado });
    return row ?? null;
  },

  async orders() {
    const total = sql`(select coalesce(sum(pd.cantidad * pd.precio_unitario), 0)
      from pedido_detalle pd where pd.id_pedido = pedido.id_pedido)`.mapWith(Number);
    return getDb()
      .select({
        id: pedido.idPedido,
        fecha: pedido.fechaHora,
        estado: pedido.estado,
        idReserva: pedido.idReserva,
        observaciones: pedido.observaciones,
        total,
      })
      .from(pedido)
      .orderBy(desc(pedido.fechaHora));
  },

  async setOrderStatus(id, estado) {
    const [row] = await getDb()
      .update(pedido)
      .set({ estado })
      .where(eq(pedido.idPedido, Number(id)))
      .returning({ id: pedido.idPedido, estado: pedido.estado });
    return row ?? null;
  },

  async users() {
    return getDb()
      .select({
        id: usuarios.idUsuario,
        nombre: usuarios.nombre,
        email: usuarios.email,
        activo: usuarios.activo,
        idCliente: usuarios.idCliente,
        roles: sql`(select coalesce(string_agg(r.nombre, ', '), '')
          from rolesxusuario ru
          inner join roles r on r.id_rol = ru.id_rol
          where ru.id_usuario = usuarios.id_usuario)`,
      })
      .from(usuarios)
      .orderBy(asc(usuarios.nombre));
  },

  async setTableActive(id, activa) {
    const [row] = await getDb()
      .update(mesa)
      .set({ activa })
      .where(eq(mesa.idMesa, Number(id)))
      .returning({ id: mesa.idMesa, numero: mesa.numero, activa: mesa.activa });
    return row ?? null;
  },
};
