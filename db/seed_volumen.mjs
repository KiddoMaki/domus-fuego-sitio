// Carga masiva adicional de datos operativos para que el panel muestre uso real.
// Es idempotente (usa marcadores VOL2-*) y NO modifica la carta pública.
// Uso: node --env-file=.env db/seed_volumen.mjs
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
const pick = (list, i) => list[i % list.length];
const round = (n) => Number(Number(n).toFixed(2));

const addDays = (base, days) => {
  const date = new Date(`${base}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const stamp = (base, days, hour = 12) =>
  `${addDays(base, days)} ${String(hour).padStart(2, "0")}:00:00`;

async function findOrCreate(selectSql, selectParams, insertSql, insertParams, idColumn) {
  const existing = await one(selectSql, selectParams);
  if (existing) return existing[idColumn];
  const created = await one(insertSql, insertParams);
  if (!created) throw new Error(`No se pudo crear el registro (${idColumn})`);
  return created[idColumn];
}

try {
  await run("BEGIN");
  console.log("Cargando volumen operativo adicional (la carta pública no se modifica)…");

  const cartaBefore = await one(`
    select (select count(*) from item)::int items,
           (select count(*) from categoria_item)::int categorias,
           (select count(*) from item_presentacion)::int presentaciones,
           (select count(*) from precio_venta)::int precios
  `);

  //Las secuencias pueden estar detrás de los IDs importados desde el SQL original.
  const identities = await all(`
    select table_name, column_name from information_schema.columns
    where table_schema='public' and identity_generation is not null
  `);
  for (const { table_name: tabla, column_name: columna } of identities) {
    const t = `"${tabla.replace(/"/g, '""')}"`;
    const c = `"${columna.replace(/"/g, '""')}"`;
    await run(
      `select setval(pg_get_serial_sequence($1,$2),
                     coalesce((select max(${c}) from public.${t}),1),
                     exists (select 1 from public.${t}))`,
      [`public.${tabla}`, columna]
    );
  }

  // ---------- Catálogos base (sin tocar la carta) ----------
  for (const [nombre, simbolo, factor, tipo] of [
    ["Kilogramo", "kg", 1000, "masa"],
    ["Litro", "L", 1000, "volumen"],
    ["Caja", "caja", 1, "cantidad"],
  ]) {
    await run(
      `insert into unidad_medida (nombre,simbolo,factor_base,tipo_magnitud)
       values ($1,$2,$3,$4) on conflict (nombre) do nothing`,
      [nombre, simbolo, factor, tipo]
    );
  }
  for (const [nombre, signo, afecta] of [
    ["Compra", 1, true], ["Venta", -1, true], ["Producido", 1, true],
    ["Consumo", -1, true], ["Merma", -1, true], ["Devolución", 1, true],
    ["Ajuste", 1, true],
  ]) {
    await run(
      `insert into tipo_movimiento (nombre,signo,afecta_stock) values ($1,$2,$3)
       on conflict (nombre) do nothing`,
      [nombre, signo, afecta]
    );
  }
  for (const [nombre, signo] of [
    ["Ingreso por venta", 1], ["Costo de venta", -1], ["Gasto operativo", -1],
    ["Compra de inventario", -1], ["Ajuste contable", 1],
  ]) {
    await run(
      `insert into tipo_movimiento_contable (nombre,signo) values ($1,$2)
       on conflict (nombre) do nothing`,
      [nombre, signo]
    );
  }
  for (const nombre of ["Carbón y leña", "Servicios básicos", "Personal", "Mantenimiento", "Marketing", "Transporte"]) {
    await run(`insert into categoria_gasto (nombre) values ($1) on conflict (nombre) do nothing`, [nombre]);
  }

  const unidad = Object.fromEntries(
    (await all("select id_unidad, nombre from unidad_medida")).map((r) => [r.nombre, r.id_unidad])
  );
  const movTipo = Object.fromEntries(
    (await all("select id_tipo_movimiento, nombre from tipo_movimiento")).map((r) => [r.nombre, r.id_tipo_movimiento])
  );
  const contTipo = Object.fromEntries(
    (await all("select id_tipo_movimiento_contable, nombre from tipo_movimiento_contable")).map((r) => [r.nombre, r.id_tipo_movimiento_contable])
  );
  const gastoCat = Object.fromEntries(
    (await all("select id_categoria_gasto, nombre from categoria_gasto")).map((r) => [r.nombre, r.id_categoria_gasto])
  );
  const kg = unidad["Kilogramo"];
  const caja = unidad["Caja"];
  const items = await all("select id_item from item order by id_item");
  const presentaciones = await all("select id_presentacion, id_item from item_presentacion order by id_presentacion");
  const precios = Object.fromEntries(
    (await all(`select id_presentacion, precio from precio_venta
                where vigente_desde <= now() and (vigente_hasta is null or vigente_hasta > now())
                order by vigente_desde desc`)).map((r) => [r.id_presentacion, Number(r.precio)])
  );
  const recetas = await all("select id_receta from receta order by id_receta");
  const costos = await all("select id_costo_receta from costo_receta order by id_costo_receta");

  // ---------- Personal, proveedores, clientes y mesas ----------
  const staff = [];
  for (const nombre of ["Carlos Paredes", "Rina Salazar", "Pablo Mena", "Lucía Ordóñez", "Esteban Vidal"]) {
    staff.push(await findOrCreate(
      "select id_usuario from usuario where nombre=$1", [nombre],
      "insert into usuario (nombre,activo) values ($1,true) returning id_usuario", [nombre],
      "id_usuario"
    ));
  }

  const proveedores = (await all("select id_proveedor from proveedor order by id_proveedor")).map((r) => r.id_proveedor);
  for (const [nombre, contacto, telefono, email] of [
    ["Río Bravo Carnes", "Hugo Salinas", "02 241 7788", "ventas@riobravo.ec"],
    ["Verde Menú", "Fanny Cedillo", "02 254 0091", "pedidos@verdemenu.ec"],
    ["Braseros Ecuador", "Omar Viteri", "098 770 112", "contacto@braserosec.ec"],
    ["Frutas de la Sierra", "Nora Inga", "02 287 3320", "ventas@frutassierra.ec"],
    ["Agua y Refrescos del Centro", "David Ponce", "02 221 6644", "distribucion@aguacentro.ec"],
    ["Harina Dorada", "Sandra Vélez", "02 269 8871", "pedidos@harinadorada.ec"],
    ["Quesos del Valle", "Miguel Astudillo", "02 278 4410", "ventas@quesosvalle.ec"],
    ["Papelería La Pluma", "Viviana Torres", "02 250 1189", "contacto@lapuma.ec"],
    ["Carbónforestal", "Ángel Chica", "099 331 882", "ventas@carbonforestal.ec"],
    ["Logística Rápida", "José Bahamonde", "02 245 9876", "despacho@logisticarapida.ec"],
  ]) {
    proveedores.push(await findOrCreate(
      "select id_proveedor from proveedor where nombre=$1", [nombre],
      `insert into proveedor (nombre,contacto,telefono,email,activo)
       values ($1,$2,$3,$4,true) returning id_proveedor`, [nombre, contacto, telefono, email],
      "id_proveedor"
    ));
  }

  const clientes = (await all("select id_cliente from cliente order by id_cliente")).map((r) => r.id_cliente);
  const nombresClientes = [
    "Alejandra Pinto", "Bryan Núñez", "Cynthia Vargas", "Dennis Aguirre", "Ericka Molina",
    "Fernando Quishpe", "Gissella Peñafiel", "Hernán Cadena", "Ivette Carrión", "Jorge Alcívar",
    "Karina Bermúdez", "Lenín Ochoa", "Mónica Larrea", "Nicolás Freire", "Odalys Campos",
    "Paúl Grijalva", "Quetzal Armijo", "Roberto Manzano", "Silvana Cordero", "Tatiana Lara",
    "Ulises Robles", "Vanessa Pontón", "Washington Ibarra", "Ximena Paulino", "Yadira Solís",
    "Zoila Merino", "Adriana Vela", "Boris Cedeño", "Cecilia Rodas", "Daniel Villao",
    "Eliana Macías", "Fabiola Ríos", "Galo Paredes", "Hilda Zamora", "Isabel Chávez",
    "Jhonny Carrasco", "Katherine Flores", "Luisa Tinajero", "Marcelo Heredia", "Nataly Bravo",
  ];
  for (const [i, nombre] of nombresClientes.entries()) {
    clientes.push(await findOrCreate(
      "select id_cliente from cliente where nombre=$1", [nombre],
      `insert into cliente (nombre,telefono,email) values ($1,$2,$3) returning id_cliente`,
      [nombre, `09${String(10000000 + i * 137).slice(0, 8)}`, `cliente${i + 1}@correo.example.com`],
      "id_cliente"
    ));
  }

  const mesas = await all("select id_mesa, numero, capacidad from mesa order by id_mesa");
  for (const [i, numero] of ["M7", "M8", "M9", "M10", "M11", "M12", "M13", "M14"].entries()) {
    const capacidad = [2, 4, 4, 6, 6, 8, 8, 10][i];
    const ubicacion = i < 3 ? "Salón" : i < 6 ? "Terraza" : "Parrilla";
    const id = await findOrCreate(
      "select id_mesa from mesa where numero=$1", [numero],
      `insert into mesa (numero,capacidad,ubicacion,activa) values ($1,$2,$3,true) returning id_mesa`,
      [numero, capacidad, ubicacion], "id_mesa"
    );
    if (!mesas.some((m) => m.id_mesa === id)) mesas.push({ id_mesa: id, numero, capacidad });
  }

  for (const item of items) {
    for (const offset of [1, 2, 3]) {
      await run(
        `insert into item_proveedor (id_item,id_proveedor,codigo_proveedor,precio_referencia)
         values ($1,$2,$3,$4) on conflict (id_item,id_proveedor) do nothing`,
        [item.id_item, proveedores[(item.id_item + offset) % proveedores.length],
         `VOL2-PROV-${item.id_item}-${offset}`, 7 + item.id_item + offset * 1.5]
      );
    }
  }

  // ---------- Caja ----------
  const cajasExistentes = (await all("select id_caja_sesion from caja_sesion order by id_caja_sesion")).map((r) => r.id_caja_sesion);
  const cajas = [...cajasExistentes];
  const cajasNuevas = [];
  for (let i = 0; i < 18; i += 1) {
    const apertura = stamp("2026-10-10", i, 8);
    const cerrada = i < 16;
    const idCaja = await findOrCreate(
      "select id_caja_sesion from caja_sesion where fecha_apertura=$1::timestamp", [apertura],
      `insert into caja_sesion
         (fecha_apertura,fecha_cierre,monto_apertura,monto_cierre,estado)
       values ($1::timestamp,
               case when $2::boolean then ($1::timestamp + interval '10 hours') else null end,
               $3::numeric, case when $2::boolean then $4::numeric else null end,
               case when $2::boolean then 'cerrada' else 'abierta' end)
       returning id_caja_sesion`,
      [apertura, cerrada, 180 + i * 15, 1400 + i * 95], "id_caja_sesion"
    );
    cajas.push(idCaja);
    cajasNuevas.push(idCaja);
  }

  // ---------- Compras: OC -> recepciones -> lotes -> movimientos -> mermas ----------
  const estadosOC = ["recibida", "recibida", "parcial", "recibida", "emitida", "cancelada", "borrador"];
  const ordenes = [];
  const detallesOC = [];
  for (let i = 0; i < 36; i += 1) {
    const marker = `VOL2-OC-${String(i + 1).padStart(3, "0")}`;
    const idOC = await findOrCreate(
      "select id_orden_compra from orden_compra where observaciones=$1", [marker],
      `insert into orden_compra (id_proveedor,fecha_emision,estado,observaciones)
       values ($1,$2::timestamp,$3,$4) returning id_orden_compra`,
      [pick(proveedores, i * 3), stamp("2026-10-08", i, 10), pick(estadosOC, i), marker],
      "id_orden_compra"
    );
    ordenes.push(idOC);
    for (const offset of [0, 1]) {
      const itemId = items[(i * 2 + offset) % items.length].id_item;
      await run(
        `insert into orden_compra_detalle
           (id_orden_compra,id_item,cantidad_solicitada,id_unidad,precio_pactado)
         values ($1,$2,$3,$4,$5) on conflict (id_orden_compra,id_item) do nothing`,
        [idOC, itemId, 18 + (i % 9) * 4 + offset * 6, itemId <= 3 ? kg : caja,
         7 + itemId * 1.35 + (i % 4)]
      );
      const detalle = await one(
        "select id_oc_detalle from orden_compra_detalle where id_orden_compra=$1 and id_item=$2",
        [idOC, itemId]
      );
      detallesOC.push({
        id: detalle.id_oc_detalle, idOC, idItem: itemId,
        unidad: itemId <= 3 ? kg : caja, precio: 8 + (i % 6),
      });
    }
  }

  const recepciones = [];
  for (let i = 0; i < 26; i += 1) {
    const marker = `VOL2-REC-${String(i + 1).padStart(3, "0")}`;
    const idRecepcion = await findOrCreate(
      "select id_recepcion from recepcion where observaciones=$1", [marker],
      `insert into recepcion (id_orden_compra,fecha_recepcion,estado,observaciones)
       values ($1,$2::timestamp,$3,$4) returning id_recepcion`,
      [pick(ordenes, i), stamp("2026-10-09", i, 11), i % 7 === 0 ? "parcial" : "completa", marker],
      "id_recepcion"
    );
    const idOC = pick(ordenes, i);
    const detalle = detallesOC.filter((d) => d.idOC === idOC)[i % 2];
    await run(
      `insert into recepcion_detalle
         (id_recepcion,id_orden_compra,id_oc_detalle,cantidad_recibida,id_unidad,costo_real_unitario)
       select $1,$2,$3,$4,$5,$6
       where not exists (
         select 1 from recepcion_detalle where id_recepcion=$1 and id_oc_detalle=$3
       )`,
      [idRecepcion, idOC, detalle.id, 12 + (i % 8) * 3, detalle.unidad, detalle.precio]
    );
    const rd = await one(
      "select id_recepcion_detalle from recepcion_detalle where id_recepcion=$1 and id_oc_detalle=$2",
      [idRecepcion, detalle.id]
    );
    recepciones.push({ id: rd.id_recepcion_detalle, idItem: detalle.idItem, unidad: detalle.unidad, costo: detalle.precio });
  }

  const lotes = [];
  for (let i = 0; i < 30; i += 1) {
    const rd = pick(recepciones, i);
    const codigo = `VOL2-L-${String(i + 1).padStart(3, "0")}`;
    const vencimiento = i < 3 ? addDays("2026-11-24", 3 + i * 2) : addDays("2026-11-24", 20 + i * 2);
    const idLote = await findOrCreate(
      "select id_lote from lote_inventario where codigo_lote=$1", [codigo],
      `insert into lote_inventario
         (id_item,codigo_lote,id_recepcion_detalle,fecha_ingreso,fecha_vencimiento,
          cantidad_inicial,costo_unitario,id_unidad,estado)
       values ($1,$2,$3,$4::timestamp,$5::date,$6::numeric,$7::numeric,$8,'disponible')
       returning id_lote`,
      [rd.idItem, codigo, rd.id, stamp("2026-10-10", i, 9), vencimiento,
       26 + (i % 7) * 5, 8 + (i % 5) * 1.25, rd.unidad],
      "id_lote"
    );
    lotes.push({ id: idLote, idItem: rd.idItem, unidad: rd.unidad, idRecepcion: rd.id, costo: rd.costo });
  }

  const movimientosMerma = [];
  for (let i = 0; i < 60; i += 1) {
    const lote = pick(lotes, i);
    const inMarker = `VOL2-MOV-IN-${String(i + 1).padStart(3, "0")}`;
    await run(
      `insert into movimiento_inventario
         (id_item,id_tipo_movimiento,id_lote,cantidad,id_unidad,costo_unitario,
          id_recepcion_detalle,fecha_movimiento,id_usuario,observaciones)
       select $1,$2,$3,$4,$5,$6,$7,$8::timestamp,$9,$10
       where not exists (select 1 from movimiento_inventario where observaciones=$10)`,
      [lote.idItem, movTipo["Compra"], lote.id, 8 + (i % 10), lote.unidad, lote.costo,
       lote.idRecepcion, stamp("2026-10-10", i, 12), pick(staff, i), inMarker]
    );
    const esMerma = i % 3 === 0;
    const outMarker = `VOL2-MOV-OUT-${String(i + 1).padStart(3, "0")}`;
    const salida = await one(
      `insert into movimiento_inventario
         (id_item,id_tipo_movimiento,id_lote,cantidad,id_unidad,costo_unitario,
          fecha_movimiento,id_usuario,observaciones)
       select $1,$2,$3,$4,$5,$6,$7::timestamp,$8,$9
       where not exists (select 1 from movimiento_inventario where observaciones=$9)
       returning id_movimiento`,
      [lote.idItem, movTipo[esMerma ? "Merma" : "Consumo"], lote.id,
       3 + (i % 6), lote.unidad, lote.costo, stamp("2026-10-12", i, 15),
       pick(staff, i + 1), outMarker]
    );
    if (esMerma && salida) movimientosMerma.push(salida.id_movimiento);
  }
  for (const [i, idMovimiento] of movimientosMerma.entries()) {
    await run(
      `insert into merma (id_movimiento,motivo,id_usuario_responsable,descripcion)
       values ($1,$2,$3,$4) on conflict (id_movimiento) do nothing`,
      [idMovimiento, pick(["Desposte", "Cocción", "Caducidad", "Sobreporción"], i),
       pick(staff, i), `VOL2: merma registrada durante el turno de ${pick(["salón", "cocina", "parrilla"], i)}.`]
    );
  }

  // ---------- Producción ----------
  const estadosOP = ["terminada", "en_proceso", "planificada", "terminada", "cancelada", "en_proceso"];
  const ordenesProd = [];
  for (let i = 0; i < 30; i += 1) {
    const marker = `VOL2-OP-${String(i + 1).padStart(3, "0")}`;
    const estado = pick(estadosOP, i);
    const idOP = await findOrCreate(
      "select id_orden_produccion from orden_produccion where observaciones=$1", [marker],
      `insert into orden_produccion
         (id_receta,tipo,estado,fecha_planificada,fecha_ejecucion,rendimiento_real,observaciones)
       values ($1,$2,$3::varchar,$4::timestamp,
               case when $3::varchar in ('terminada','en_proceso') then $5::timestamp else null end,
               case when $3::varchar='terminada' then $6::numeric else null end,$7)
       returning id_orden_produccion`,
      [pick(recetas, i).id_receta, pick(["parrilla", "cocina", "bebida"], i), estado,
       stamp("2026-10-11", i, 7), stamp("2026-10-11", i, 13), 7 + (i % 6) * 0.7, marker],
      "id_orden_produccion"
    );
    ordenesProd.push(idOP);
    for (const offset of [1, 2]) {
      const insumo = items[(i + offset) % items.length].id_item;
      await run(
        `insert into orden_produccion_detalle
           (id_orden_produccion,id_item_insumo,cantidad_teorica,cantidad_real,id_unidad,merma_asociada)
         values ($1,$2,$3,$4,$5,$6) on conflict (id_orden_produccion,id_item_insumo) do nothing`,
        [idOP, insumo, 1.5 + offset * 0.5, 1.4 + offset * 0.45,
         insumo <= 3 ? kg : caja, 0.1 + offset * 0.05]
      );
    }
  }

  // ---------- Reservas ----------
  const estadosReserva = ["cumplida", "cumplida", "cancelada", "no_asistio", "cumplida", "confirmada", "pendiente"];
  const reservas = [];
  for (let i = 0; i < 70; i += 1) {
    const marker = `VOL2-RES-${String(i + 1).padStart(3, "0")}`;
    const futuro = i >= 45;
    const fecha = futuro ? addDays("2026-11-25", i % 30) : addDays("2026-09-20", i);
    const comensales = 2 + (i % 5);
    const mesaElegida = mesas.filter((m) => m.capacidad >= comensales)[i % mesas.filter((m) => m.capacidad >= comensales).length];
    const idReserva = await findOrCreate(
      "select id_reserva from reserva where observaciones=$1", [marker],
      `insert into reserva
         (id_cliente,id_mesa,fecha,hora,cantidad_comensales,estado,observaciones)
       values ($1,$2,$3::date,$4::time,$5,$6,$7) returning id_reserva`,
      [pick(clientes, i * 5), mesaElegida.id_mesa, fecha,
       pick(["12:30", "13:00", "19:00", "19:30", "20:00", "20:30"], i),
       comensales, futuro ? (i % 2 ? "confirmada" : "pendiente") : pick(estadosReserva, i), marker],
      "id_reserva"
    );
    reservas.push(idReserva);
    for (const offset of [0, 3]) {
      const itemId = items[(i + offset) % items.length].id_item;
      await run(
        `insert into reserva_detalle (id_reserva,id_item,cantidad,observaciones)
         select $1,$2,$3,$4
         where not exists (
           select 1 from reserva_detalle where id_reserva=$1 and id_item=$2
         )`,
        [idReserva, itemId, 1 + (i % 2), `VOL2-RD-${i + 1}`]
      );
    }
  }

  // ---------- Pedidos ----------
  const estadosPedido = ["cerrado", "servido", "servido", "cerrado", "cancelado", "en_preparacion", "abierto"];
  const pedidos = [];
  const lineasPedido = [];
  for (let i = 0; i < 70; i += 1) {
    const marker = `VOL2-PED-${String(i + 1).padStart(3, "0")}`;
    const idPedido = await findOrCreate(
      "select id_pedido from pedido where observaciones=$1", [marker],
      `insert into pedido (id_reserva,fecha_hora,estado,observaciones)
       values ($1,$2::timestamp,$3,$4) returning id_pedido`,
      [pick(reservas, i), stamp("2026-10-10", i % 18, 13), pick(estadosPedido, i), marker],
      "id_pedido"
    );
    pedidos.push(idPedido);
    for (const offset of [0, 1, 2]) {
      const presentacion = presentaciones[(i * 3 + offset) % presentaciones.length];
      await run(
        `insert into pedido_detalle (id_pedido,id_presentacion,cantidad,precio_unitario,origen)
         select $1,$2,$3,$4,$5
         where not exists (
           select 1 from pedido_detalle where id_pedido=$1 and id_presentacion=$2
         )`,
        [idPedido, presentacion.id_presentacion, 1 + ((i + offset) % 3),
         precios[presentacion.id_presentacion] ?? 10,
         pick(["salon", "llevar", "delivery"], i)]
      );
      const linea = await one(
        `select id_pedido_detalle, cantidad, precio_unitario from pedido_detalle
         where id_pedido=$1 and id_presentacion=$2`, [idPedido, presentacion.id_presentacion]
      );
      lineasPedido.push({ idPedido, idLinea: linea.id_pedido_detalle,
        total: Number(linea.cantidad) * Number(linea.precio_unitario) });
    }
  }

  // ---------- Ventas y pagos ----------
  const totalesPedido = Object.fromEntries(pedidos.map((id) => [id, round(
    lineasPedido.filter((l) => l.idPedido === id).reduce((sum, l) => sum + l.total, 0)
  )]));
  const ventas = [];
  for (let i = 0; i < 60; i += 1) {
    const idVenta = await findOrCreate(
      "select id_venta from venta where id_pedido=$1", [pedidos[i]],
      `insert into venta (id_pedido,id_caja_sesion,fecha_venta,estado)
       values ($1,$2,$3::timestamp,$4) returning id_venta`,
      [pedidos[i], pick(cajasNuevas, i), stamp("2026-10-10", i % 18, 15),
       i % 11 === 0 ? "anulada" : "confirmada"],
      "id_venta"
    );
    ventas.push({ id: idVenta, idPedido: pedidos[i], total: totalesPedido[pedidos[i]] });
  }
  for (const [i, venta] of ventas.entries()) {
    const medios = i % 3 === 0 ? [["efectivo", 0.6], ["tarjeta", 0.4]]
      : i % 3 === 1 ? [["tarjeta", 1]] : [["transferencia", 1]];
    for (const [medio, factor] of medios) {
      const monto = round(Math.max(1, venta.total * factor));
      await run(
        `insert into pago (id_venta,medio,monto,estado,fecha_pago)
         select $1,$2::varchar,$3::numeric,$4,$5::timestamp
         where not exists (
           select 1 from pago where id_venta=$1 and medio=$2::varchar and monto=$3::numeric
         )`,
        [venta.id, medio, monto, i % 13 === 0 ? "pendiente" : "aprobado",
         stamp("2026-10-10", i % 18, 16)]
      );
    }
  }

  // ---------- Gastos y contabilidad ----------
  const conceptos = [
    "Carbón de quebracho", "Factura de luz", "Nómina de parrilla", "Limpieza de campana",
    "Campaña de Instagram", "Transporte de proveedores", "Leña de espino", "Servicio de agua",
    "Nómina de salón", "Mantenimiento de neveras", "Impresión de cartas", "Combustible",
    "Seguro del local", "Licencia de sistema", "Reparación de sillas",
  ];
  const categorias = ["Carbón y leña", "Servicios básicos", "Personal", "Mantenimiento", "Marketing", "Transporte"];
  const gastos = [];
  for (let i = 0; i < 45; i += 1) {
    const concepto = `${pick(conceptos, i)} — ${addDays("2026-10-10", i)}`;
    const fecha = addDays("2026-10-10", i);
    const idGasto = await findOrCreate(
      "select id_gasto from gasto_operativo where concepto=$1 and fecha=$2::date", [concepto, fecha],
      `insert into gasto_operativo
         (concepto,id_categoria_gasto,monto,fecha,id_caja_sesion)
       values ($1,$2,$3::numeric,$4::date,$5) returning id_gasto`,
      [concepto, gastoCat[pick(categorias, i)], 38 + (i % 12) * 17.5, fecha, pick(cajasNuevas, i)],
      "id_gasto"
    );
    gastos.push({ id: idGasto, monto: 38 + (i % 12) * 17.5 });
  }

  for (const [i, venta] of ventas.entries()) {
    await run(
      `insert into movimiento_contable
         (id_tipo_movimiento_contable,id_venta,monto,fecha)
       select $1,$2,$3::numeric,$4::timestamp
       where not exists (
         select 1 from movimiento_contable
         where id_tipo_movimiento_contable=$1 and id_venta=$2 and monto=$3::numeric and fecha=$4::timestamp
       )`,
      [contTipo["Ingreso por venta"], venta.id, venta.total, stamp("2026-10-10", i % 18, 17)]
    );
  }
  for (const [i, gasto] of gastos.entries()) {
    await run(
      `insert into movimiento_contable
         (id_tipo_movimiento_contable,id_gasto,monto,fecha)
       select $1,$2,$3::numeric,$4::timestamp
       where not exists (
         select 1 from movimiento_contable
         where id_tipo_movimiento_contable=$1 and id_gasto=$2 and monto=$3::numeric
       )`,
      [contTipo["Gasto operativo"], gasto.id, gasto.monto, stamp("2026-10-10", i, 18)]
    );
  }
  for (const [i, costo] of costos.entries()) {
    const detalle = await one(
      `select coalesce(sum(cantidad*costo_unitario),0) total
       from costo_receta_detalle where id_costo_receta=$1`, [costo.id_costo_receta]
    );
    await run(
      `insert into movimiento_contable
         (id_tipo_movimiento_contable,id_costo_receta,monto,fecha)
       select $1,$2,$3::numeric,$4::timestamp
       where not exists (
         select 1 from movimiento_contable
         where id_tipo_movimiento_contable=$1 and id_costo_receta=$2 and monto=$3::numeric
       )`,
      [contTipo["Costo de venta"], costo.id_costo_receta, round(detalle.total), stamp("2026-10-12", i, 18)]
    );
  }
  for (let i = 0; i < 30; i += 1) {
    const monto = 45 + i * 3.25;
    await run(
      `insert into movimiento_contable (id_tipo_movimiento_contable,monto,fecha)
       select $1,$2::numeric,$3::timestamp
       where not exists (
         select 1 from movimiento_contable
         where id_tipo_movimiento_contable=$1 and monto=$2::numeric and fecha=$3::timestamp
       )`,
      [contTipo["Ajuste contable"], monto, stamp("2026-10-13", i, 19)]
    );
  }

  await run(`
    insert into auditoria_log (usuario,modulo,accion,detalle)
    select 'sistema','datos','Carga masiva de datos',
           'Se agregaron reservas, pedidos, ventas, pagos, compras, inventario, producción y contabilidad con el prefijo VOL2-.'
    where not exists (
      select 1 from auditoria_log where accion='Carga masiva de datos' and detalle like 'Se agregaron reservas%'
    )
  `);

  const cartaAfter = await one(`
    select (select count(*) from item)::int items,
           (select count(*) from categoria_item)::int categorias,
           (select count(*) from item_presentacion)::int presentaciones,
           (select count(*) from precio_venta)::int precios
  `);
  if (JSON.stringify(cartaBefore) !== JSON.stringify(cartaAfter)) {
    throw new Error("La carta pública cambió durante la carga; se revierte la transacción");
  }

  await run("COMMIT");
  const resumen = await all(`
    select 'proveedor' tabla, count(*)::int total from proveedor
    union all select 'cliente', count(*)::int from cliente
    union all select 'mesa', count(*)::int from mesa
    union all select 'caja_sesion', count(*)::int from caja_sesion
    union all select 'orden_compra', count(*)::int from orden_compra
    union all select 'recepcion', count(*)::int from recepcion
    union all select 'lote_inventario', count(*)::int from lote_inventario
    union all select 'movimiento_inventario', count(*)::int from movimiento_inventario
    union all select 'orden_produccion', count(*)::int from orden_produccion
    union all select 'reserva', count(*)::int from reserva
    union all select 'pedido', count(*)::int from pedido
    union all select 'venta', count(*)::int from venta
    union all select 'pago', count(*)::int from pago
    union all select 'gasto_operativo', count(*)::int from gasto_operativo
    union all select 'movimiento_contable', count(*)::int from movimiento_contable
    union all select 'auditoria_log', count(*)::int from auditoria_log
    order by tabla
  `);
  console.log("Datos totales en Neon:");
  resumen.forEach((r) => console.log(`  ${r.tabla}: ${r.total}`));
  console.log("Carta intacta:", cartaAfter);
} catch (error) {
  const failedQuery = lastQuery;
  await run("ROLLBACK");
  console.error("Error al cargar volumen:", error.message);
  console.error("Última consulta:", failedQuery);
  process.exitCode = 1;
} finally {
  await client.release();
  await pool.end();
}
