# Domus Fuego — Sitio web + pedidos y reservas (demo con persistencia real)

> **Estado:** frontend + backend + panel administrativo funcionando de punta a punta. Catálogo,
> pedidos, reservas, cuentas y administración se guardan en **Neon (PostgreSQL)** usando
> `DomusDBs.sql`. Productos y precios son la carta cargada en la BD. Sin pagos en línea
> (las ventas se cierran en caja, tablas `caja_sesion`/`venta`).

## Arquitectura (n-capas: routes → controllers → services → models → database)

```text
public/                 Vista (SPA + panel)
  index.html            Esencia, carta, reservas, login e historial
  admin.html            Panel administrativo (UI del repo domus-admin, conectada a /api/admin)
  assets/styles.css     Tema público (oscuro/dorado, contraste AA)
  assets/admin.css      Tema del panel
  js/app.js             Consume /api/*; redirige a /admin.html si el rol es ADMINISTRADOR
  js/admin.js           Carga datos reales del panel y gestiona altas/ediciones/bajas
src/                    Backend en capas (JavaScript)
  routes/               Rutas Express: /api/products, /orders, /reservations, /auth, /admin
  controllers/          Traducen req/res hacia servicios
  services/             Reglas de negocio y traducción de errores HTTP
  models/               Consultas Drizzle (incluye admin.model.js con acceso a 35 tablas)
  database/             connection.js (pool Neon) + schema.js (esquema Drizzle)
  middleware/           requestId, logs, CORS, sanitize, validate, paginate, JWT, roles, errores
  domain/               Reglas puras (OrderBuilder)
netlify/functions/      Adaptadores delgados: api.mjs (catch-all /api/*)
db/migrations/          002_carta_fields.sql, 003_auth.sql, 005_fix_identity_sequences.sql,
                        006_audit_log.sql (bitácora) y 007_audit_log_timestamptz.sql (hora local)
tests/                  node --test (14 pruebas)
```

Mapa al esquema DOMUS:
- Catálogo = `item` (tipo_item='venta') → `item_presentacion` (es_venta) → `precio_venta` (vigente) y `categoria_item`.
- Pedido web = `pedido` (estado 'abierto') + `pedido_detalle` (precio copiado al momento). **No** crea `venta`:
  la venta se cierra en caja con `id_caja_sesion`.
- Reserva = `reserva` + asignación automática de `mesa` (capacidad ≥ comensales, sin solape con
  reservas pendientes/confirmadas en la misma fecha y hora). Sin disponibilidad → **409**.
- Sin tabla de reseñas: `DOMUS.sql` no la incluye, así que **no** hay reseñas (no se inventó DDL).

## API de administración (Postman)

Todas requieren `Authorization: Bearer <token>` y rol `ADMINISTRADOR` (obtenido con
`POST /api/auth/login`). Si el token falta o es de cliente: 401/403.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/admin/overview` | Métricas generales |
| GET | `/api/admin/catalog` | Catálogo con precio vigente |
| GET | `/api/admin/reservations` | Reservas con cliente y mesa |
| PATCH | `/api/admin/reservations/:id/estado` | `{ "estado": "pendiente|confirmada|cancelada|cumplida|no_asistio" }` |
| GET | `/api/admin/orders` | Pedidos con total calculado |
| PATCH | `/api/admin/orders/:id/estado` | `{ "estado": "abierto|en_preparacion|servido|cerrado|cancelado" }` |
| GET | `/api/admin/users` | Usuarios con roles |
| POST | `/api/admin/users` | Alta de usuario: `{ nombre, email, password, rol }` |
| GET | `/api/admin/inventory` | Lotes con categoría, política, stock y valorización |
| GET | `/api/admin/purchases` | Órdenes de compra con proveedor, recepciones y total |
| GET | `/api/admin/production` | Órdenes de producción con receta, costos y merma |
| GET | `/api/admin/sales` | Ventas con caja, medios de pago y total |
| GET | `/api/admin/finance` | Movimientos contables reales |
| GET | `/api/admin/cash` | Sesiones de caja |
| GET | `/api/admin/audit` | Métricas reales del esquema en Neon |
| GET | `/api/admin/logs` | Bitácora real de acciones del panel (`auditoria_log`) |
| GET | `/api/admin/tables` | Listado de tablas administrables y su PK |
| GET | `/api/admin/data/:table` / `.../schema` / `.../:id` | Consulta genérica de tablas permitidas |
| POST / PATCH / DELETE | `/api/admin/data/:table[/:id]` | Altas, ediciones y bajas genéricas |

## Uso local

```sh
npm install
# .env con DATABASE_URL (pooler) y JWT_SECRET — nunca se commitea (.gitignore)
npm run dev        # netlify dev → http://localhost:8888
npm run dev:api    # API Express directa → http://localhost:3000/api
npm test           # 14 pruebas
npm run seed:operativo  # datos operativos base en Neon (no toca la carta)
npm run seed:volumen    # volumen adicional idempotente (prefijo VOL2-, no toca la carta)
```

Cuentas de prueba: administrador `kiddo@domusfuego.local` / `1234` (rol `ADMINISTRADOR`),
cliente `ana@example.com` / `1234` (rol `CLIENTE`). Al iniciar sesión como administrador,
la SPA abre `/admin.html`; los clientes vuelven a Reservas o a la vista pendiente.

El panel precarga todos los módulos antes de mostrarlos: cambiar de pestaña no vuelve a consultar
la API ni muestra valores demo. La pestaña activa se conserva al recargar (`sessionStorage`). En
**Mesas & Reservas**, modificar el combo de estado revela un botón **Actualizar estado**; el cambio
solo se guarda al pulsarlo. El panel y el sitio público incluyen controles de texto grande, alto
contraste, reducción de movimiento y velocidad de animaciones, con foco visible y objetivos táctiles
amplios en móvil.

## Producción

- Netlify (sitio y Functions): https://domus-fuego-sitio.netlify.app — panel en `/admin.html`.
- `DATABASE_URL`, `JWT_SECRET`, `PUBLIC_SITE_URL`, `CORS_ALLOWED_ORIGINS` configuradas en Netlify.
- Despliegue: `netlify deploy --prod`
- Neon: proyecto `empty-voice-61657813`, base `domus_fuego`, branch `production`.

## Decisiones y limitaciones

- Se usa `@neondatabase/serverless` (443/HTTPS-WSS) en lugar de `pg` sobre 5432: el runner de esta
  máquina/red no alcanza el puerto 5432 y en serverless es más robusto.
- `dns.setDefaultResultOrder('ipv4first')` en `src/database/connection.js` evita `EAI_AGAIN`.
- Autenticación JWT propia (`JWT_SECRET`) + scrypt para contraseñas; roles leídos de `rolesxusuario`.
- La auditoría del panel persiste en `auditoria_log` (`db/migrations/006_audit_log.sql`): altas,
  ediciones, bajas y cambios de estado quedan con usuario, módulo, fecha e IP.
- Carrito en `localStorage` (como el concepto original); el total que manda el navegador **no** se confía:
  el servidor recalcula precios desde `precio_venta`.
- Reservas y pedidos son **solicitudes pendientes**, no confirmaciones operativas del restaurante.
- Sin pagos en línea; los pedidos y reservas quedan como solicitudes registradas en Neon.
- GitHub Pages fue desactivado; el sitio vive en Netlify.

## Verificación realizada

- `npm test`: 14/14 pasan.
- Local: login admin/cliente, `/api/admin/*` con rol admin (200), cliente sin permiso (403),
  CRUD genérico de `mesa` (crear/editar/borrar) y datos de prueba eliminados.
- Producción: `/`, `/admin.html`, `/js/admin.js`, `/assets/admin.css`, `/js/app.js` y `/assets/styles.css`
  responden 200; todos los `/api/admin/*` (overview, inventario, compras, producción, ventas,
  finanzas, auditoría, reservas, pedidos, usuarios y mesas) responden 200 con token de administrador;
  sin token responde 401. Deploy: `6b05a9ca41f202ee8cf3f3c4`.
- Volumen cargado en Neon (idempotente, `db/seed_volumen.mjs`): 54 clientes, 14 mesas, 16
  proveedores, 42 órdenes de compra, 37 lotes, 128 movimientos de inventario, 40 órdenes de
  producción, 87 reservas, 82 pedidos, 69 ventas, 92 pagos, 57 gastos y 164 asientos contables.
- Auditoría: `/api/admin/logs` devuelve la bitácora real; los cambios de estado/CRUD del panel
  quedan registrados con usuario, módulo, detalle e IP. `fecha` es `timestamptz`: se muestra en la
  hora local del navegador (p. ej. 10:03 a. m. en Ecuador en vez de 15:03 UTC).
- Carta sin cambios: 8 ítems, 5 categorías, 8 presentaciones y 8 precios vigentes.

## Documentación de marca / negocio

- `DOMUS_FOGO_LOGICA_NEGOCIO_Y_CATALOGO_PARA_AGENTE.md` — brief de negocio y catálogo propuesto.
- `GUIA_NUEVO_ECOMMERCE_MVC_CORS_CORREGIDO.md` — guía de arquitectura seguida.
- `PENDIENTES_NEGOCIO.md` — preguntas para el propietario (carta real, precios, reservas, etc.).
