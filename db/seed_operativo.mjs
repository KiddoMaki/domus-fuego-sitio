// Datos operativos de demostración para el panel administrativo.
// Respeta todas las constraints del esquema DOMUS y NO modifica la carta pública
// (categoria_item, item, item_presentacion ni precio_venta).
// Uso: node --env-file=.env db/seed_operativo.mjs
import dns from "node:dns";
import { Pool } from "@neondatabase/serverless";

dns.setDefaultResultOrder("ipv4first");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
let lastQuery = "";
const run = (sql, params = []) => {
  lastQuery = sql;
  return client.query(sql, params);
};
const one = async (sql, params = []) => (await run(sql, params)).rows[0] ?? null;
const all = async (sql, params = []) => (await run(sql, params)).rows;

async function findOrCreate(selectSql, selectParams, insertSql, insertParams, idColumn) {
  const existing = await one(selectSql, selectParams);
  if (existing) return existing[idColumn];
  const created = await one(insertSql, insertParams);
  return created?.[idColumn] ?? null;
}

try {
  await run("BEGIN");
  console.log("Cargando datos operativos (la carta pública no se modifica)…");

  // El esquema importado dejó las secuencias identity detrás de los IDs reales.
  const identities = await all(`
    select table_name, column_name from information_schema.columns
    where table_schema='public' and identity_generation is not null
  `);
  for (const { table_name: tabla, column_name: columna } of identities) {
    const t = `"${tabla.replace(/"/g, '""')}"`;
    const c = `"${columna.replace(/"/g, '""')}"`;
    await run(`
      select setval(
        pg_get_serial_sequence($1, $2),
        coalesce((select max(${c}) from public.${t}), 1),
        exists (select 1 from public.${t})
      )
    `, [`public.${tabla}`, columna]);
  }

  // ---------- Catálogos base y personal operativo ----------
  for (const [nombre, simbolo, factor, tipo] of [
    ["Kilogramo", "kg", 1000, "masa"],
    ["Litro", "L", 1000, "volumen"],
    ["Caja", "caja", 1, "cantidad"],
  ]) {
    await run(
      `insert into unidad_medida (nombre, simbolo, factor_base, tipo_magnitud)
       values ($1, $2, $3, $4) on conflict (nombre) do nothing`,
      [nombre, simbolo, factor, tipo]
    );
  }
  const kgId = (await one("select id_unidad from unidad_medida where nombre='Kilogramo'")).id_unidad;
  const ltId = (await one("select id_unidad from unidad_medida where nombre='Litro'")).id_unidad;
  const cajaId = (await one("select id_unidad from unidad_medida where nombre='Caja'")).id_unidad;

  for (const [nombre, signo, afecta] of [
    ["Compra", 1, true], ["Venta", -1, true], ["Producido", 1, true],
    ["Consumo", -1, true], ["Merma", -1, true], ["Devolución", 1, true],
    ["Ajuste", 1, true],
  ]) {
    await run(
      `insert into tipo_movimiento (nombre, signo, afecta_stock) values ($1,$2,$3)
       on conflict (nombre) do nothing`, [nombre, signo, afecta]
    );
  }
  for (const [nombre, signo] of [
    ["Ingreso por venta", 1], ["Costo de venta", -1], ["Gasto operativo", -1],
    ["Compra de inventario", -1], ["Ajuste contable", 1],
  ]) {
    await run(
      `insert into tipo_movimiento_contable (nombre, signo) values ($1,$2)
       on conflict (nombre) do nothing`, [nombre, signo]
    );
  }
  for (const nombre of ["Carbón y leña", "Servicios básicos", "Personal", "Mantenimiento", "Marketing", "Transporte"]) {
    await run(`insert into categoria_gasto (nombre) values ($1) on conflict (nombre) do nothing`, [nombre]);
  }

  const movTipo = Object.fromEntries(
    (await all("select id_tipo_movimiento, nombre from tipo_movimiento")).map((r) => [r.nombre, r.id_tipo_movimiento])
  );
  const contTipo = Object.fromEntries(
    (await all("select id_tipo_movimiento_contable, nombre from tipo_movimiento_contable")).map((r) => [r.nombre, r.id_tipo_movimiento_contable])
  );
  const gastoCat = Object.fromEntries(
    (await all("select id_categoria_gasto, nombre from categoria_gasto")).map((r) => [r.nombre, r.id_categoria_gasto])
  );

  const staff = [];
  for (const nombre of ["Luis Benavides", "Ana Castillo", "Martín Ruiz"]) {
    staff.push(await findOrCreate(
      "select id_usuario from usuario where nombre=$1", [nombre],
      "insert into usuario (nombre, activo) values ($1, true) returning id_usuario", [nombre],
      "id_usuario"
    ));
  }

  // ---------- Proveedores y clientes ----------
  const proveedores = [];
  for (const p of [
    ["Carnes Andinas S.A.", "Jorge Mora", "02 245 1180", "ventas@carnesandinas.com"],
    ["Del Campo Insumos", "Lucía Torres", "02 260 7744", "pedidos@delcampo.ec"],
    ["Quebracho Carbón", "Raúl Paredes", "098 551 204", "carbon@quebracho.ec"],
    ["Lácteos del Sur", "María José Vega", "02 288 3901", "contacto@lacteosdelsur.com"],
    ["Bebidas del Valle", "Carlos Ríos", "02 233 9002", "distribucion@bebidasdelvalle.ec"],
    ["Panadería La Espiga", "Elena Ruiz", "02 256 4188", "pedidos@laespiga.ec"],
  ]) {
    proveedores.push(await findOrCreate(
      "select id_proveedor from proveedor where nombre=$1", [p[0]],
      `insert into proveedor (nombre, contacto, telefono, email, activo)
       values ($1,$2,$3,$4,true) returning id_proveedor`, p, "id_proveedor"
    ));
  }

  const clientes = [];
  for (const c of [
    ["Familia Rodríguez", "098 112 233", "rodriguez.family@example.com"],
    ["Sofía Merino", "099 448 120", "sofia.merino@example.com"],
    ["Diego Carmona", "098 771 905", "diego.carmona@example.com"],
    ["Camila Vásquez", "099 203 410", "camila.vasquez@example.com"],
    ["Juan Pablo Ávila", "098 340 778", "jp.avila@example.com"],
    ["Valeria Núñez", "099 881 552", "valeria.nunez@example.com"],
    ["Andrés Loaiza", "098 615 337", "andres.loaiza@example.com"],
    ["Gabriela Freire", "099 127 664", "gabriela.freire@example.com"],
  ]) {
    clientes.push(await findOrCreate(
      "select id_cliente from cliente where nombre=$1", [c[0]],
      `insert into cliente (nombre, telefono, email) values ($1,$2,$3)
       returning id_cliente`, c, "id_cliente"
    ));
  }

  const items = await all("select id_item, nombre from item order by id_item");
  const presentaciones = await all("select id_presentacion, id_item from item_presentacion order by id_presentacion");
  const precios = Object.fromEntries(
    (await all(`select id_presentacion, precio from precio_venta pv
      where vigente_desde <= now() and (vigente_hasta is null or vigente_hasta > now())
      order by vigente_desde desc`)).map((r) => [r.id_presentacion, Number(r.precio)])
  );

  const proveedorPorItem = {
    1: proveedores[0], 2: proveedores[0], 3: proveedores[0], 4: proveedores[1],
    5: proveedores[1], 6: proveedores[5], 7: proveedores[3], 8: proveedores[4],
  };
  for (const item of items) {
    await run(
      `insert into item_proveedor (id_item, id_proveedor, codigo_proveedor, precio_referencia)
       values ($1,$2,$3,$4) on conflict (id_item, id_proveedor) do nothing`,
      [item.id_item, proveedorPorItem[item.id_item], `PROV-${String(item.id_item).padStart(3, "0")}`, 10 + item.id_item * 2.5]
    );
  }
  await run(
    `insert into item_proveedor (id_item, id_proveedor, codigo_proveedor, precio_referencia)
     values (1,$1,'ALT-ANGUS-01',13.5) on conflict (id_item, id_proveedor) do nothing`,
    [proveedores[1]]
  );

  // ---------- Compras: OC -> recepciones -> lotes -> movimientos -> mermas ----------
  const estadosOC = ["recibida", "recibida", "parcial", "emitida", "borrador", "cancelada"];
  const ordenes = [];
  for (let i = 0; i < estadosOC.length; i += 1) {
    const marker = `SEED-OC-${String(i + 1).padStart(2, "0")}`;
    ordenes.push(await findOrCreate(
      "select id_orden_compra from orden_compra where observaciones=$1", [marker],
      `insert into orden_compra (id_proveedor, fecha_emision, estado, observaciones)
       values ($1, now() - make_interval(days => $2::int), $3, $4)
       returning id_orden_compra`,
      [proveedores[i % proveedores.length], 30 - i * 4, estadosOC[i], marker],
      "id_orden_compra"
    ));
  }

  const detallesOC = [];
  for (let i = 0; i < ordenes.length; i += 1) {
    for (const [offset, itemIndex] of [0, 1].entries()) {
      const itemId = items[(i + offset) % items.length].id_item;
      await run(
        `insert into orden_compra_detalle
           (id_orden_compra, id_item, cantidad_solicitada, id_unidad, precio_pactado)
         values ($1,$2,$3,$4,$5) on conflict (id_orden_compra, id_item) do nothing`,
        [ordenes[i], itemId, 20 + i * 3 + offset * 5, itemId <= 3 ? kgId : cajaId, 8 + itemId * 1.75]
      );
      const detalle = await one(
        "select id_oc_detalle from orden_compra_detalle where id_orden_compra=$1 and id_item=$2",
        [ordenes[i], itemId]
      );
      detallesOC.push({ id: detalle.id_oc_detalle, idOC: ordenes[i], idItem: itemId, unidad: itemId <= 3 ? kgId : cajaId });
    }
  }

  const recepciones = [];
  for (let i = 0; i < 4; i += 1) {
    const marker = `SEED-REC-${String(i + 1).padStart(2, "0")}`;
    recepciones.push(await findOrCreate(
      "select id_recepcion from recepcion where observaciones=$1", [marker],
      `insert into recepcion (id_orden_compra, fecha_recepcion, estado, observaciones)
       values ($1, now() - make_interval(days => $2::int), $3, $4) returning id_recepcion`,
      [ordenes[i], 28 - i * 4, i === 2 ? "parcial" : "completa", marker],
      "id_recepcion"
    ));
  }

  // Las FK son compuestas: (id_recepcion, id_orden_compra) y (id_oc_detalle, id_orden_compra).
  await Promise.all(recepciones.map((idRecepcion, i) => {
    const detalle = detallesOC.find((d) => d.idOC === ordenes[i]);
    return run(
      `insert into recepcion_detalle
         (id_recepcion, id_orden_compra, id_oc_detalle, cantidad_recibida, id_unidad, costo_real_unitario)
       select $1, $2, $3, $4, $5, $6
       where not exists (select 1 from recepcion_detalle where id_recepcion=$1 and id_oc_detalle=$3)`,
      [idRecepcion, detalle.idOC, detalle.id, 14 + i * 3, detalle.unidad, 9 + i * 1.5]
    );
  }));
  const todosDetallesRecepcion = await all("select id_recepcion_detalle, id_unidad from recepcion_detalle order by id_recepcion_detalle");

  const lotes = [];
  for (let i = 0; i < todosDetallesRecepcion.length; i += 1) {
    const itemId = items[i % items.length].id_item;
    const codigo = `L-2026-${String(i + 1).padStart(3, "0")}`;
    await run(
      `insert into lote_inventario
         (id_item, codigo_lote, id_recepcion_detalle, fecha_ingreso, fecha_vencimiento,
          cantidad_inicial, costo_unitario, id_unidad, estado)
       values ($1,$2,$3, now() - make_interval(days => $4::int), current_date + $5::int,
               $6,$7,$8,$9)
       on conflict (id_item, codigo_lote) do nothing`,
      [itemId, codigo, todosDetallesRecepcion[i].id_recepcion_detalle, 25 - i * 2,
        i === 0 ? 3 : 20 + i * 5, 30 + i * 4, 9 + i * 0.75, todosDetallesRecepcion[i].id_unidad,
        i === 0 ? "disponible" : "disponible"]
    );
    const lote = await one("select id_lote from lote_inventario where codigo_lote=$1", [codigo]);
    lotes.push(lote.id_lote);
  }

  const movimientos = [];
  for (let i = 0; i < lotes.length; i += 1) {
    const lote = await one(
      "select id_item, id_unidad, cantidad_inicial, costo_unitario, id_recepcion_detalle from lote_inventario where id_lote=$1",
      [lotes[i]]
    );
    const markerIn = `SEED-MOV-IN-${i + 1}`;
    await run(
      `insert into movimiento_inventario
         (id_item, id_tipo_movimiento, id_lote, cantidad, id_unidad, costo_unitario,
          id_recepcion_detalle, fecha_movimiento, id_usuario, observaciones)
       select $1,$2,$3,$4,$5,$6,$7, now() - make_interval(days => $8::int), $9,$10
       where not exists (select 1 from movimiento_inventario where observaciones=$10)`,
      [lote.id_item, movTipo["Compra"], lotes[i], lote.cantidad_inicial, lote.id_unidad,
        lote.costo_unitario, lote.id_recepcion_detalle, 24 - i * 2, staff[i % staff.length], markerIn]
    );
    const markerOut = `SEED-MOV-OUT-${i + 1}`;
    const salida = await run(
      `insert into movimiento_inventario
         (id_item, id_tipo_movimiento, id_lote, cantidad, id_unidad, costo_unitario,
          fecha_movimiento, id_usuario, observaciones)
       select $1,$2,$3,$4,$5,$6, now() - make_interval(days => $7::int), $8,$9
       where not exists (select 1 from movimiento_inventario where observaciones=$9)
       returning id_movimiento`,
      [lote.id_item, movTipo[i % 3 === 0 ? "Merma" : "Consumo"], lotes[i],
        Number(lote.cantidad_inicial) * (0.25 + (i % 3) * 0.1), lote.id_unidad,
        lote.costo_unitario, 12 - i, staff[(i + 1) % staff.length], markerOut]
    );
    if (salida.rows[0]) movimientos.push(salida.rows[0].id_movimiento);
  }

  for (const [i, motivo] of ["Desposte", "Cocción", "Caducidad", "Sobreporción"].entries()) {
    if (!movimientos[i]) continue;
    await run(
      `insert into merma (id_movimiento, motivo, id_usuario_responsable, descripcion)
       values ($1,$2,$3,$4) on conflict (id_movimiento) do nothing`,
      [movimientos[i], motivo, staff[i % staff.length], `Merma registrada en ${motivo.toLowerCase()} del turno.`]
    );
  }

  // ---------- Recetas, costos y producción ----------
  const nombresReceta = [
    "Picaña a la brasa", "Rib eye al romero", "Colita de cuadril a la parrilla",
    "Parrillada personal completa", "Parrillada para dos completa", "Hamburguesa bacon artesanal",
    "Alitas BBQ con sésamo", "Limonada de coco natural",
  ];
  const recetas = [];
  for (let i = 0; i < nombresReceta.length; i += 1) {
    await run(
      `insert into receta (id_item_resultante, nombre, tipo, rendimiento, id_unidad_rendimiento, activa)
       values ($1,$2,$3,$4,$5,true) on conflict (id_item_resultante, nombre) do nothing`,
      [items[i].id_item, nombresReceta[i], i === 7 ? "bebida" : "principal", 8 + i, i === 7 ? ltId : kgId]
    );
    recetas.push((await one("select id_receta from receta where id_item_resultante=$1 and nombre=$2", [items[i].id_item, nombresReceta[i]])).id_receta);
  }

  for (let i = 0; i < recetas.length; i += 1) {
    for (const offset of [1, 2]) {
      const insumo = items[(i + offset) % items.length].id_item;
      await run(
        `insert into receta_detalle (id_receta, id_item_insumo, cantidad, id_unidad, merma_esperada_pct)
         values ($1,$2,$3,$4,$5) on conflict (id_receta, id_item_insumo) do nothing`,
        [recetas[i], insumo, 0.25 + offset * 0.15, insumo <= 3 ? kgId : cajaId, 3 + offset * 2]
      );
    }
  }

  const costos = [];
  for (let i = 0; i < recetas.length; i += 1) {
    await run(
      `insert into costo_receta (id_receta, fecha_calculo, rendimiento)
       select $1, now() - make_interval(days => $2::int), $3
       where not exists (select 1 from costo_receta where id_receta=$1)`,
      [recetas[i], 10 - i, 8 + i]
    );
    const costo = await one("select id_costo_receta from costo_receta where id_receta=$1", [recetas[i]]);
    costos.push(costo.id_costo_receta);
  }
  for (let i = 0; i < costos.length; i += 1) {
    for (const offset of [1, 2]) {
      const insumo = items[(i + offset) % items.length].id_item;
      await run(
        `insert into costo_receta_detalle
           (id_costo_receta, id_item_insumo, cantidad, id_unidad, costo_unitario)
         values ($1,$2,$3,$4,$5) on conflict (id_costo_receta, id_item_insumo) do nothing`,
        [costos[i], insumo, 0.4 + offset * 0.2, insumo <= 3 ? kgId : cajaId, 6 + i + offset]
      );
    }
  }

  const estadosOP = ["terminada", "en_proceso", "planificada", "terminada", "cancelada", "en_proceso", "planificada", "terminada", "en_proceso", "planificada"];
  const ordenesProd = [];
  for (let i = 0; i < estadosOP.length; i += 1) {
    const marker = `SEED-OP-${String(i + 1).padStart(2, "0")}`;
    const resultado = await run(
      `insert into orden_produccion
         (id_receta, tipo, estado, fecha_planificada, fecha_ejecucion, rendimiento_real, observaciones)
       select $1,$2,$3::varchar, now() - make_interval(days => $4::int),
              case when $3::varchar in ('terminada','en_proceso')
                   then now() - make_interval(days => $5::int) else null end,
              case when $3::varchar='terminada' then $6::numeric else null end, $7
       where not exists (select 1 from orden_produccion where observaciones=$7)
       returning id_orden_produccion`,
      [recetas[i % recetas.length], i === 7 ? "bebida" : i % 2 ? "parrilla" : "cocina",
        estadosOP[i], 8 - (i % 6), 6 - (i % 5), 7.5 + i * 0.4, marker]
    );
    const idOP = resultado.rows[0]?.id_orden_produccion
      ?? (await one("select id_orden_produccion from orden_produccion where observaciones=$1", [marker])).id_orden_produccion;
    ordenesProd.push(idOP);
  }
  for (let i = 0; i < ordenesProd.length; i += 1) {
    for (const offset of [1, 2]) {
      const insumo = items[(i + offset) % items.length].id_item;
      await run(
        `insert into orden_produccion_detalle
           (id_orden_produccion, id_item_insumo, cantidad_teorica, cantidad_real, id_unidad, merma_asociada)
         values ($1,$2,$3,$4,$5,$6) on conflict (id_orden_produccion, id_item_insumo) do nothing`,
        [ordenesProd[i], insumo, 2 + offset * 0.5, 2 + offset * 0.35, insumo <= 3 ? kgId : cajaId, 0.1 + offset * 0.05]
      );
    }
  }
  for (let i = 0; i < 3; i += 1) {
    await run(
      `insert into lote_inventario
         (id_item, codigo_lote, id_orden_produccion, fecha_ingreso, fecha_vencimiento,
          cantidad_inicial, costo_unitario, id_unidad, estado)
       values ($1,$2,$3, now() - make_interval(days => $4::int), current_date + 14,
               $5,$6,$7,'disponible')
       on conflict (id_item, codigo_lote) do nothing`,
      [items[i].id_item, `OP-2026-${String(i + 1).padStart(3, "0")}`, ordenesProd[i], 5 - i, 18 + i * 3, 11 + i, kgId]
    );
  }

  // ---------- Caja, reservas, pedidos, ventas y pagos ----------
  const cajas = [];
  for (let i = 0; i < 6; i += 1) {
    const fechaApertura = `2026-11-${String(18 + i).padStart(2, "0")} 08:00:00`;
    const cerrada = i < 5;
    cajas.push(await findOrCreate(
      "select id_caja_sesion from caja_sesion where fecha_apertura=$1::timestamp", [fechaApertura],
      `insert into caja_sesion
         (fecha_apertura, fecha_cierre, monto_apertura, monto_cierre, estado)
       values ($1::timestamp,
               case when $2::boolean then $1::timestamp + interval '10 hours' else null end,
               $3::numeric, case when $2::boolean then $4::numeric else null end,
               case when $2::boolean then 'cerrada' else 'abierta' end)
       returning id_caja_sesion`,
      [fechaApertura, cerrada, 150 + i * 25, 1250 + i * 180], "id_caja_sesion"
    ));
  }

  const estadosReserva = ["confirmada", "cumplida", "pendiente", "confirmada", "cancelada", "no_asistio", "confirmada"];
  const reservasNuevas = [];
  for (let i = 0; i < 14; i += 1) {
    const marker = `SEED-RES-${String(i + 1).padStart(2, "0")}`;
    const dia = 24 + i;
    const fecha = dia <= 30 ? `2026-11-${dia}` : `2026-12-${dia - 30}`;
    const resultado = await run(
      `insert into reserva
         (id_cliente, id_mesa, fecha, hora, cantidad_comensales, estado, observaciones)
       select $1,$2,$3::date,$4::time,$5,$6,$7
       where not exists (select 1 from reserva where observaciones=$7)
       returning id_reserva`,
      [clientes[i % clientes.length], (i % 6) + 1, fecha,
        ["12:30", "13:00", "19:00", "19:30", "20:00", "20:30"][i % 6],
        2 + (i % 5), estadosReserva[i % estadosReserva.length], marker]
    );
    const idReserva = resultado.rows[0]?.id_reserva
      ?? (await one("select id_reserva from reserva where observaciones=$1", [marker])).id_reserva;
    reservasNuevas.push(idReserva);
  }
  for (let i = 0; i < reservasNuevas.length; i += 1) {
    for (const itemId of [items[i % items.length].id_item, items[(i + 3) % items.length].id_item]) {
      await run(
        `insert into reserva_detalle (id_reserva, id_item, cantidad, observaciones)
         select $1,$2,$3,$4
         where not exists (select 1 from reserva_detalle where id_reserva=$1 and id_item=$2)`,
        [reservasNuevas[i], itemId, 1 + (i % 2), `SEED-RD-${i + 1}`]
      );
    }
  }

  const estadosPedido = ["cerrado", "servido", "en_preparacion", "abierto", "cancelado", "cerrado"];
  const pedidos = [];
  for (let i = 0; i < 12; i += 1) {
    const marker = `SEED-PED-${String(i + 1).padStart(2, "0")}`;
    const resultado = await run(
      `insert into pedido (id_reserva, fecha_hora, estado, observaciones)
       select $1, now() - make_interval(days => $2::int), $3, $4
       where not exists (select 1 from pedido where observaciones=$4)
       returning id_pedido`,
      [reservasNuevas[i % reservasNuevas.length], 10 - (i % 8), estadosPedido[i % estadosPedido.length], marker]
    );
    const idPedido = resultado.rows[0]?.id_pedido
      ?? (await one("select id_pedido from pedido where observaciones=$1", [marker])).id_pedido;
    pedidos.push(idPedido);
  }
  for (let i = 0; i < pedidos.length; i += 1) {
    for (const offset of [0, 1]) {
      const presentacion = presentaciones[(i + offset) % presentaciones.length];
      await run(
        `insert into pedido_detalle (id_pedido, id_presentacion, cantidad, precio_unitario, origen)
         select $1,$2,$3,$4,'salon'
         where not exists (
           select 1 from pedido_detalle where id_pedido=$1 and id_presentacion=$2
         )`,
        [pedidos[i], presentacion.id_presentacion, 1 + (i % 3), precios[presentacion.id_presentacion] ?? 10]
      );
    }
  }

  const ventas = [];
  for (let i = 0; i < 9; i += 1) {
    const resultado = await run(
      `insert into venta (id_pedido, id_caja_sesion, fecha_venta, estado)
       values ($1,$2, now() - make_interval(days => $3::int), $4)
       on conflict (id_pedido) do nothing returning id_venta`,
      [pedidos[i], cajas[i % 5], 9 - i, i === 6 ? "anulada" : "confirmada"]
    );
    const idVenta = resultado.rows[0]?.id_venta
      ?? (await one("select id_venta from venta where id_pedido=$1", [pedidos[i]])).id_venta;
    ventas.push(idVenta);
  }
  for (let i = 0; i < ventas.length; i += 1) {
    const total = await one(
      `select coalesce(sum(cantidad * precio_unitario), 0) as total
       from pedido_detalle where id_pedido=$1`, [pedidos[i]]
    );
    const medios = i % 3 === 0 ? [["efectivo", 1], ["tarjeta", 0.5]]
      : i % 3 === 1 ? [["tarjeta", 1]] : [["transferencia", 1]];
    for (const [medio, factor] of medios) {
      await run(
        `insert into pago (id_venta, medio, monto, estado, fecha_pago)
         select $1,$2::varchar,$3::numeric,$4::varchar, now() - make_interval(days => $5::int)
         where not exists (select 1 from pago where id_venta=$1 and medio=$2::varchar)`,
        [ventas[i], medio, Math.max(1, Number(total.total) * factor), i === 7 ? "pendiente" : "aprobado", 9 - i]
      );
    }
  }

  const gastos = [];
  for (let i = 0; i < 12; i += 1) {
    const concepto = [
      "Carbón de quebracho blanco", "Factura eléctrica", "Nómina de cocina", "Mantenimiento de parrilla",
      "Campaña en redes sociales", "Transporte de carnes", "Leña de espino", "Servicio de internet",
      "Nómina de salón", "Reparación de campana", "Impresión de menús", "Combustible reparto",
    ][i];
    const categoria = ["Carbón y leña", "Servicios básicos", "Personal", "Mantenimiento", "Marketing", "Transporte"][i % 6];
    const fecha = `2026-11-${String(12 + i).padStart(2, "0")}`;
    const idGasto = await findOrCreate(
      "select id_gasto from gasto_operativo where concepto=$1 and fecha=$2::date", [concepto, fecha],
      `insert into gasto_operativo
         (concepto, id_categoria_gasto, monto, fecha, id_caja_sesion)
       values ($1,$2,$3,$4::date,$5) returning id_gasto`,
      [concepto, gastoCat[categoria], 45 + i * 13.5, fecha, cajas[i % 5]], "id_gasto"
    );
    gastos.push(idGasto);
  }

  // Asientos contables con fecha explícita para que el seed sea repetible.
  for (let i = 0; i < ventas.length; i += 1) {
    const total = await one(
      `select coalesce(sum(cantidad * precio_unitario), 0) as total
       from pedido_detalle where id_pedido=$1`, [pedidos[i]]
    );
    await run(
      `insert into movimiento_contable
         (id_tipo_movimiento_contable, id_venta, monto, fecha)
       select $1,$2,$3, now() - make_interval(days => $4::int)
       where not exists (
         select 1 from movimiento_contable
         where id_tipo_movimiento_contable=$1 and id_venta=$2 and monto=$3
       )`,
      [contTipo["Ingreso por venta"], ventas[i], Number(total.total), 9 - i]
    );
  }
  for (let i = 0; i < gastos.length; i += 1) {
    await run(
      `insert into movimiento_contable (id_tipo_movimiento_contable, id_gasto, monto, fecha)
       select $1,$2,$3, now() - make_interval(days => $4::int)
       where not exists (
         select 1 from movimiento_contable where id_tipo_movimiento_contable=$1 and id_gasto=$2
       )`,
      [contTipo["Gasto operativo"], gastos[i], 45 + i * 13.5, 11 - (i % 10)]
    );
  }
  for (let i = 0; i < costos.length; i += 1) {
    const costo = await one(
      `select coalesce(sum(cantidad * costo_unitario), 0) as total
       from costo_receta_detalle where id_costo_receta=$1`, [costos[i]]
    );
    await run(
      `insert into movimiento_contable (id_tipo_movimiento_contable, id_costo_receta, monto, fecha)
       select $1,$2,$3, now() - make_interval(days => $4::int)
       where not exists (
         select 1 from movimiento_contable where id_tipo_movimiento_contable=$1 and id_costo_receta=$2
       )`,
      [contTipo["Costo de venta"], costos[i], Number(costo.total), 8 - i]
    );
  }

  await run("COMMIT");
  const resumen = await all(`
    select 'proveedor' as tabla, count(*)::int as total from proveedor
    union all select 'orden_compra', count(*)::int from orden_compra
    union all select 'recepcion', count(*)::int from recepcion
    union all select 'lote_inventario', count(*)::int from lote_inventario
    union all select 'movimiento_inventario', count(*)::int from movimiento_inventario
    union all select 'receta', count(*)::int from receta
    union all select 'orden_produccion', count(*)::int from orden_produccion
    union all select 'reserva', count(*)::int from reserva
    union all select 'pedido', count(*)::int from pedido
    union all select 'venta', count(*)::int from venta
    union all select 'pago', count(*)::int from pago
    union all select 'gasto_operativo', count(*)::int from gasto_operativo
    union all select 'movimiento_contable', count(*)::int from movimiento_contable
    order by tabla
  `);
  console.log("Datos cargados:");
  resumen.forEach((r) => console.log(`  ${r.tabla}: ${r.total}`));
} catch (error) {
  const failedQuery = lastQuery;
  await run("ROLLBACK");
  console.error("Error al cargar datos:", error.message);
  console.error("Consulta fallida:", failedQuery);
  process.exitCode = 1;
} finally {
  await client.release();
  await pool.end();
}
