import { createRepository } from "./_shared/repository.factory.mjs";
import { ok, fail } from "./_shared/http.mjs";
import { compose, handleErrors, withCors, parseJson } from "./_shared/middleware.mjs";

const products = createRepository("products");

const route = async (ctx) => {
  const { httpMethod, queryStringParameters } = ctx.event;

  if (httpMethod === "OPTIONS") return ok({});

  if (httpMethod === "GET") {
    if (queryStringParameters?.meta === "categories") {
      return ok(await products.categories());
    }
    const id = queryStringParameters?.id;
    if (!id) {
      return ok(await products.list({
        category: queryStringParameters?.category,
        q: queryStringParameters?.q,
      }));
    }
    const productId = Number(id);
    if (!Number.isInteger(productId)) return fail(400, "id de producto inválido");
    const product = await products.findById(productId);
    return product ? ok(product) : fail(404, "Producto no encontrado");
  }
  return fail(405, "Método no permitido");
};

export const handler = compose(handleErrors, withCors, parseJson, route);
