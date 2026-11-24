// Adaptador de compatibilidad para /.netlify/functions/reservations.
import { adapt } from "./_shared/express.adapter.mjs";

export const handler = adapt("reservations");
