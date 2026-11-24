// Servidor local para probar las APIs con Postman: npm run dev:api (http://localhost:3000/api)
import { createApp } from "./app.js";
import { config } from "./config/env.js";

const app = createApp();
app.listen(config.port, () => {
  console.log(`API Domus Fuego escuchando en http://localhost:${config.port}/api`);
});
