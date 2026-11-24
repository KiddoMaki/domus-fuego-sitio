// MODELO de cliente: el esquema no garantiza email único, así que la búsqueda
// por correo y el alta se resuelven explícitamente aquí.
import { sql } from "drizzle-orm";
import { getDb } from "../database/connection.js";
import { cliente } from "../database/schema.js";

export const customerModel = {
  async findOrCreate({ name, email, phone }) {
    const db = getDb();

    if (email) {
      const [found] = await db
        .select({ id: cliente.idCliente })
        .from(cliente)
        .where(sql`lower(${cliente.email}) = lower(${email})`)
        .limit(1);

      if (found) {
        await db
          .update(cliente)
          .set({
            nombre: name,
            ...(phone ? { telefono: phone } : {}),
          })
          .where(eqId(found.id));
        return found.id;
      }
    }

    const [created] = await db
      .insert(cliente)
      .values({ nombre: name, telefono: phone ?? null, email: email ?? null })
      .returning({ id: cliente.idCliente });
    return created.id;
  },
};

function eqId(id) {
  // Se importa aquí para mantener visible que el filtro es por llave primaria.
  return sql`${cliente.idCliente} = ${id}`;
}
