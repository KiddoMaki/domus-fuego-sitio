// Adaptador de compatibilidad para /.netlify/functions/products.
import { adapt } from "./_shared/express.adapter.mjs";

export const handler = adapt("products");
