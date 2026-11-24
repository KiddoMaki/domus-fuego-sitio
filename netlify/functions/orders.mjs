// Adaptador de compatibilidad para /.netlify/functions/orders.
import { adapt } from "./_shared/express.adapter.mjs";

export const handler = adapt("orders");
