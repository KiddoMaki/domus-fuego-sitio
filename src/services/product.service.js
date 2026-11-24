// SERVICIO: orquesta el modelo de productos; la lógica de negocio vive aquí,
// no en el controlador ni en las rutas.
import { productModel } from "../models/index.js";

export const productService = {
  async list(filters, pagination) {
    const [products, total] = await Promise.all([
      productModel.list({ ...filters, ...pagination }),
      productModel.count(filters),
    ]);
    return { products, total };
  },

  getById(id) {
    return productModel.findById(id);
  },

  categories() {
    return productModel.categories();
  },
};
