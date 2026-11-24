// MODELO de usuarios, roles y la relación rolesxusuario.
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../database/connection.js";
import { cliente, roles, rolesxusuario, usuarios } from "../database/schema.js";

const publicColumns = {
  id: usuarios.idUsuario,
  nombre: usuarios.nombre,
  email: usuarios.email,
  activo: usuarios.activo,
  idCliente: usuarios.idCliente,
};

async function rolesOf(userId) {
  const rows = await getDb()
    .select({ nombre: roles.nombre })
    .from(rolesxusuario)
    .innerJoin(roles, eq(roles.idRol, rolesxusuario.idRol))
    .where(eq(rolesxusuario.idUsuario, userId));
  return rows.map((row) => row.nombre);
}

async function withRoles(row) {
  if (!row) return null;
  return { ...row, roles: await rolesOf(row.id) };
}

export const userModel = {
  async findByEmail(email) {
    const [row] = await getDb()
      .select({ ...publicColumns, passwordHash: usuarios.passwordHash })
      .from(usuarios)
      .where(eq(usuarios.email, String(email).trim().toLowerCase()))
      .limit(1);
    return withRoles(row);
  },

  findById(id) {
    return getDb()
      .select(publicColumns)
      .from(usuarios)
      .where(and(eq(usuarios.idUsuario, id), eq(usuarios.activo, true)))
      .limit(1)
      .then(([row]) => withRoles(row));
  },

  async createClient({ nombre, email }) {
    // El esquema importado no sincronizó la secuencia de cliente; calculamos el
    // siguiente id desde los datos para que altas públicas y de admin no choquen.
    const [next] = await getDb()
      .select({ id: sql`coalesce(max(${cliente.idCliente}), 0) + 1`.mapWith(Number) })
      .from(cliente);
    const [row] = await getDb()
      .insert(cliente)
      .values({ idCliente: next.id, nombre, email: email || null })
      .returning({ id: cliente.idCliente });
    return row.id;
  },

  async create({ nombre, email, passwordHash, idCliente }) {
    const [row] = await getDb()
      .insert(usuarios)
      .values({
        nombre,
        email: String(email).trim().toLowerCase(),
        passwordHash,
        idCliente: idCliente ?? null,
      })
      .returning(publicColumns);
    return withRoles(row);
  },

  async assignRole(userId, roleName) {
    const [role] = await getDb()
      .select({ id: roles.idRol })
      .from(roles)
      .where(eq(roles.nombre, roleName))
      .limit(1);
    if (!role) throw new Error(`Rol no encontrado: ${roleName}`);

    await getDb()
      .insert(rolesxusuario)
      .values({ idUsuario: userId, idRol: role.id })
      .onConflictDoNothing();
  },
};
