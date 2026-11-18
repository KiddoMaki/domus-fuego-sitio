# Domus Fuego — Sitio web + pedidos y reservas (demo con persistencia real)

> **Estado:** frontend + backend funcionando de punta a punta. Catálogo, pedidos y reservas se
> guardan en **Neon (PostgreSQL)** usando tu esquema `db/schema.sql` (DOMUS.sql). Productos,
> precios y disponibilidad siguen siendo **DEMO** pendientes de confirmación del propietario.
> Sin pagos en línea (las ventas se generan en caja, tabla `venta`/`caja_sesion`).

## Arquitectura (MVC, guía `GUIA_NUEVO_ECOMMERCE_MVC_CORS_CORREGIDO.md`)

```text
public/                 Vista: HTML semántico y accesible
  index.html            Landing + menú/catálogo + carrito + reserva
  styles.css            Tema premium oscuro (dorado, contraste AA)
  js/app.js             Consume /api/*; carrito en localStorage (total real lo calcula el servidor)
netlify/functions/      Controladores REST (Netlify Functions, TypeScript-free .mjs)
  products.mjs          GET /api/products (?category=, ?q=, ?meta=categories) y ?id=
  orders.mjs            POST /api/orders (crea pedido + pedido_detalle) · GET /api/orders?id=
  reservations.mjs      POST /api/reservations (asigna mesa por capacidad y disponibilidad) · GET ?id=
  _shared/              Modelo: db.mjs (pool, driver @neondatabase/serverless), repositories,
                        Factory, OrderBuilder, middleware (CORS, JSON, validación, errores)
db/schema.sql           Tu esquema completo (35 tablas, 4 vistas, constraints incl. EXCLUDE gist)
db/seed_demo.sql        SEED DEMO — carta propuesta, NO oficial (ver PENDIENTES_NEGOCIO.md)
tests/                  node --test (OrderBuilder, middleware)
```

Mapa al esquema DOMUS:
- Catálogo = `item` (tipo_item='venta') → `item_presentacion` (es_venta) → `precio_venta` (vigente) y `categoria_item`.
- Pedido web = `pedido` (estado 'abierto') + `pedido_detalle` (precio copiado al momento). **No** crea `venta`:
  la venta se cierra en caja con `id_caja_sesion`.
- Reserva = `reserva` + asignación automática de `mesa` (capacidad ≥ comensales, sin solape con
  reservas pendientes/confirmadas en la misma fecha y hora). Sin disponibilidad → **409**.
- Sin tabla de reseñas: `DOMUS.sql` no la incluye, así que **no** hay reseñas (no se inventó DDL).

## Uso local

```sh
npm install
# .env con DATABASE_URL (pooler) — nunca se commitea (está en .gitignore)
npm run dev        # netlify dev → http://localhost:8888
npm test           # 8 pruebas unitarias
```

## Producción

- Netlify (sitio y Functions): https://domus-fuego-sitio.netlify.app
- `DATABASE_URL`, `PUBLIC_SITE_URL`, `CORS_ALLOWED_ORIGINS` configuradas como variables de entorno en Netlify.
- Despliegue: `netlify deploy --prod`
- Neon: proyecto `ECOMERCE-OPTIMIZACION` (branch `main`, `neondb`), **solo** el esquema DOMUS + seed DEMO.

## Decisiones y limitaciones

- Se usa `@neondatabase/serverless` (443/HTTPS-WSS) en lugar de `pg` sobre 5432: el runner de esta
  máquina/red no alcanza el puerto 5432 y en serverless es más robusto.
- `dns.setDefaultResultOrder('ipv4first')` en `db.mjs` evita `EAI_AGAIN` en redes IPv6-preferentes sin ruta.
- Carrito en `localStorage` (como el concepto original); el total que manda el navegador **no** se confía:
  el servidor recalcula precios desde `precio_venta`.
- Reservas y pedidos son **solicitudes pendientes**, no confirmaciones operativas del restaurante.
- Sin autenticación, sin pagos, sin panel admin. Ver `PENDIENTES_NEGOCIO.md`.
- GitHub Pages fue desactivado; el sitio vive en Netlify.

## Verificación realizada

- `npm test`: 8/8 pasan.
- `netlify dev` local: front 200; `GET /api/products?meta=categories` 200; catálogo por categoría/búsqueda 200;
  `POST /api/orders` crea pedido (#total correcto, 22.50 USD) y `GET /api/orders?id=1` lo devuelve;
  `POST /api/reservations` asigna mesa (#1 → mesa 3, cap. 4); validaciones 400/422 funcionan; datos de prueba borrados tras verificar.
- Netlify API: deploy `ready` en producción (Front y Functions). **No se pudo abrir la URL de producción
  desde esta máquina** (la red bloquea el egreso a `*.netlify.app`); verificar manualmente en un navegador.

## Documentación de marca / negocio

- `DOMUS_FOGO_LOGICA_NEGOCIO_Y_CATALOGO_PARA_AGENTE.md` — brief de negocio y catálogo propuesto.
- `GUIA_NUEVO_ECOMMERCE_MVC_CORS_CORREGIDO.md` — guía de arquitectura seguida.
- `PENDIENTES_NEGOCIO.md` — preguntas para el propietario (carta real, precios, reservas, etc.).
