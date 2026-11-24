// Esquema ORM (Drizzle) mapeado a las tablas de db/schema.sql que usa la API.
// Los nombres de propiedades son camelCase; los de columna son los reales en PostgreSQL.
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const categoriaItem = pgTable("categoria_item", {
  idCategoria: integer("id_categoria").primaryKey(),
  nombre: varchar("nombre", { length: 60 }).notNull(),
  tipo: varchar("tipo", { length: 20 }).notNull(),
});

export const unidadMedida = pgTable("unidad_medida", {
  idUnidad: integer("id_unidad").primaryKey(),
  nombre: varchar("nombre", { length: 20 }).notNull(),
  simbolo: varchar("simbolo", { length: 10 }).notNull(),
  factorBase: numeric("factor_base", { precision: 14, scale: 6, mode: "number" }).notNull(),
  tipoMagnitud: varchar("tipo_magnitud", { length: 10 }).notNull(),
});

export const item = pgTable(
  "item",
  {
    idItem: integer("id_item").primaryKey(),
    nombre: varchar("nombre", { length: 120 }).notNull(),
    idCategoria: integer("id_categoria")
      .notNull()
      .references(() => categoriaItem.idCategoria),
    tipoItem: varchar("tipo_item", { length: 20 }).notNull(),
    activo: boolean("activo").notNull().default(true),
    descripcion: text("descripcion"),
    imagenUrl: text("imagen_url"),
    imagenAlt: text("imagen_alt"),
    ordenVisual: integer("orden_visual").notNull().default(0),
  },
  (table) => [index("idx_item_categoria").on(table.idCategoria)]
);

export const itemPresentacion = pgTable(
  "item_presentacion",
  {
    idPresentacion: integer("id_presentacion").primaryKey(),
    idItem: integer("id_item")
      .notNull()
      .references(() => item.idItem),
    nombre: varchar("nombre", { length: 60 }).notNull(),
    esVenta: boolean("es_venta").notNull().default(false),
  },
  (table) => [index("idx_presentacion_item").on(table.idItem)]
);

export const precioVenta = pgTable("precio_venta", {
  idPrecio: integer("id_precio").primaryKey(),
  idPresentacion: integer("id_presentacion")
    .notNull()
    .references(() => itemPresentacion.idPresentacion),
  precio: numeric("precio", { precision: 12, scale: 2, mode: "number" }).notNull(),
  vigenteDesde: timestamp("vigente_desde").notNull(),
  vigenteHasta: timestamp("vigente_hasta"),
});

export const cliente = pgTable("cliente", {
  idCliente: integer("id_cliente").primaryKey(),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  telefono: varchar("telefono", { length: 30 }),
  email: varchar("email", { length: 120 }),
});

export const mesa = pgTable("mesa", {
  idMesa: integer("id_mesa").primaryKey(),
  numero: varchar("numero", { length: 10 }).notNull(),
  capacidad: integer("capacidad").notNull(),
  activa: boolean("activa").notNull().default(true),
});

export const reserva = pgTable(
  "reserva",
  {
    idReserva: integer("id_reserva").primaryKey(),
    idCliente: integer("id_cliente")
      .notNull()
      .references(() => cliente.idCliente),
    idMesa: integer("id_mesa")
      .notNull()
      .references(() => mesa.idMesa),
    fecha: date("fecha").notNull(),
    hora: time("hora").notNull(),
    cantidadComensales: integer("cantidad_comensales").notNull(),
    estado: varchar("estado", { length: 15 }).notNull().default("pendiente"),
    observaciones: text("observaciones"),
  },
  (table) => [index("idx_reserva_mesa_fecha").on(table.idMesa, table.fecha)]
);

export const pedido = pgTable(
  "pedido",
  {
    idPedido: integer("id_pedido").primaryKey(),
    idReserva: integer("id_reserva").references(() => reserva.idReserva),
    fechaHora: timestamp("fecha_hora").notNull().default(sql`now()`),
    estado: varchar("estado", { length: 15 }).notNull().default("abierto"),
    observaciones: text("observaciones"),
  },
  (table) => [index("idx_pedido_reserva").on(table.idReserva)]
);

export const pedidoDetalle = pgTable(
  "pedido_detalle",
  {
    idPedidoDetalle: integer("id_pedido_detalle").primaryKey(),
    idPedido: integer("id_pedido")
      .notNull()
      .references(() => pedido.idPedido),
    idPresentacion: integer("id_presentacion")
      .notNull()
      .references(() => itemPresentacion.idPresentacion),
    cantidad: numeric("cantidad", { precision: 14, scale: 4, mode: "number" }).notNull(),
    precioUnitario: numeric("precio_unitario", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
    origen: varchar("origen", { length: 15 }).notNull(),
  },
  (table) => [index("idx_pedido_detalle_pedido").on(table.idPedido)]
);

// Relaciones (las "conexiones" entre tablas) para poder hacer consultas con el ORM.
export const categoriaItemRelations = relations(categoriaItem, ({ many }) => ({
  items: many(item),
}));

export const itemRelations = relations(item, ({ one, many }) => ({
  categoria: one(categoriaItem, {
    fields: [item.idCategoria],
    references: [categoriaItem.idCategoria],
  }),
  presentaciones: many(itemPresentacion),
}));

export const itemPresentacionRelations = relations(
  itemPresentacion,
  ({ one, many }) => ({
    item: one(item, {
      fields: [itemPresentacion.idItem],
      references: [item.idItem],
    }),
    precios: many(precioVenta),
    detallesPedido: many(pedidoDetalle),
  })
);

export const precioVentaRelations = relations(precioVenta, ({ one }) => ({
  presentacion: one(itemPresentacion, {
    fields: [precioVenta.idPresentacion],
    references: [itemPresentacion.idPresentacion],
  }),
}));

export const clienteRelations = relations(cliente, ({ many }) => ({
  reservas: many(reserva),
}));

export const mesaRelations = relations(mesa, ({ many }) => ({
  reservas: many(reserva),
}));

export const reservaRelations = relations(reserva, ({ one, many }) => ({
  cliente: one(cliente, {
    fields: [reserva.idCliente],
    references: [cliente.idCliente],
  }),
  mesa: one(mesa, { fields: [reserva.idMesa], references: [mesa.idMesa] }),
  pedidos: many(pedido),
}));

export const pedidoRelations = relations(pedido, ({ one, many }) => ({
  reserva: one(reserva, {
    fields: [pedido.idReserva],
    references: [reserva.idReserva],
  }),
  detalles: many(pedidoDetalle),
}));

export const pedidoDetalleRelations = relations(pedidoDetalle, ({ one }) => ({
  pedido: one(pedido, {
    fields: [pedidoDetalle.idPedido],
    references: [pedido.idPedido],
  }),
  presentacion: one(itemPresentacion, {
    fields: [pedidoDetalle.idPresentacion],
    references: [itemPresentacion.idPresentacion],
  }),
}));

// Autenticación: usuarios, roles y la tabla intermedia rolesxusuario.
export const roles = pgTable("roles", {
  idRol: integer("id_rol").primaryKey(),
  nombre: varchar("nombre", { length: 30 }).notNull(),
  descripcion: text("descripcion"),
});

export const usuarios = pgTable("usuarios", {
  idUsuario: integer("id_usuario").primaryKey(),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  email: varchar("email", { length: 160 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  activo: boolean("activo").notNull().default(true),
  idCliente: integer("id_cliente").references(() => cliente.idCliente),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const rolesxusuario = pgTable("rolesxusuario", {
  idRolxusuario: integer("id_rolxusuario").primaryKey(),
  idUsuario: integer("id_usuario")
    .notNull()
    .references(() => usuarios.idUsuario, { onDelete: "cascade" }),
  idRol: integer("id_rol")
    .notNull()
    .references(() => roles.idRol, { onDelete: "cascade" }),
});

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  cliente: one(cliente, {
    fields: [usuarios.idCliente],
    references: [cliente.idCliente],
  }),
  roles: many(rolesxusuario),
}));

export const rolesxusuarioRelations = relations(rolesxusuario, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [rolesxusuario.idUsuario],
    references: [usuarios.idUsuario],
  }),
  rol: one(roles, {
    fields: [rolesxusuario.idRol],
    references: [roles.idRol],
  }),
}));
