// CONTROLADOR: traduce req/res de Express a llamadas al servicio y devuelve JSON.
import { setPaginationHeaders } from "../middleware/pagination.js";
import { productService } from "../services/index.js";
import { notFoundError } from "../utils/http-error.js";

export async function listProducts(req, res) {
  const query = req.valid?.query ?? {};

  // Compatibilidad con el front actual: ?id=7 también devuelve un producto.
  if (query.id) return getProduct(req, res);

  // Compatibilidad con el front actual: ?meta=categories devuelve el catálogo de categorías.
  if (query.meta === "categories") {
    return res.json(await productService.categories());
  }

  const { products, total } = await productService.list(query, req.pagination);
  setPaginationHeaders(res, req.pagination, total);
  return res.json(products);
}

export async function getProduct(req, res) {
  const rawId = req.valid?.params?.id ?? req.valid?.query?.id;
  const product = await productService.getById(Number(rawId));
  if (!product) throw notFoundError("Producto no encontrado");
  return res.json(product);
}
