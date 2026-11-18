# Guía para crear un nuevo e-commerce con MVC + GitHub + Netlify + Neon

> Documento de instrucciones **para un proyecto nuevo**, inspirado en el concepto de PichuPaper.
> No es la guía de este repositorio: aquí se describe cómo montar **otra tienda** con backend real.
> El prototipo actual es estático (HTML/CSS/JS, GitHub Pages, sin base de datos); el nuevo proyecto
> conserva la metodología de diseño IHC pero cambia la infraestructura.

---

## 0. Qué se hereda del concepto y qué cambia

Del concepto de PichuPaper se conserva **el método de trabajo y la experiencia de usuario**:

- Catálogo con búsqueda y filtros, fichas con galería, carrito, checkout y confirmación.
- Flujo de usuario documentado en los cinco pasos (usuario, entrada, pasos, decisiones, punto final).
- Aplicación de heurísticas de Nielsen y principios POUR de WCAG 2.2.
- Documentación en Markdown: README, auditoría e informe de flujo.
- Nomenclatura clara de archivos y rutas relativas.

Lo que **cambia** en el proyecto nuevo:

| Aspecto | PichuPaper (concepto actual) | Nuevo e-commerce (esta guía) |
|---|---|---|
| Datos | Arreglos en `script.js` + `localStorage` | Base de datos PostgreSQL en **Neon** |
| Backend | Ninguno (demo estática) | **Netlify Functions** como controladores |
| API | Ninguna | **API REST**: verbos HTTP, JSON y códigos de estado |
| Vista | `index.html` + `script.js` con rutas `#/...` | HTML semántico y accesible que consume la API |
| Despliegue | GitHub Pages (`pages.yml`) | **Netlify** conectado a GitHub |
| Persistencia | No hay | Pedidos, productos, reseñas y usuarios en Neon |
| Arquitectura | Implícita | **MVC explícito** + patrones Singleton, Factory, Repository, Builder |
| Lógica transversal | Repetida en el JS | **Middleware** (CORS, JSON, validación, errores) |
| Esquema de BD | No aplica | Lo **entregas tú**; el código se adapta a él |

> **Entregables que aportas tú:** (1) las imágenes optimizadas y ligeras, con la convención
> `<id>-01.webp`, `<id>-02.webp`; y (2) el esquema de Neon (`schema.sql`, migraciones y `seed.sql`).
> Los códigos SQL y las rutas de imagen de esta guía son **plantillas de referencia**: se reemplazan
> por lo que entregues, sin cambiar las convenciones de nombres ni la separación por capas.

> Importante: el checkout del concepto es ficticio. Para el proyecto nuevo, si se van a manejar pagos
> reales se requiere una pasarela (por ejemplo Stripe) y cumplimiento legal. Esta guía no instrumenta
> cobros reales; el ejemplo sigue siendo una compra de demostración, pero **con datos persistidos**.

---

## 1. Cómo se maneja el trabajo

### 1.1 Metodología (se mantiene del concepto)

1. Definir usuario y objetivo (persona o perfil de tarea).
2. Identificar el punto de entrada.
3. Mapear los pasos significativos del flujo de compra.
4. Incluir decisiones, validaciones y rutas de error.
5. Determinar el punto final.
6. Registrar heurísticas de Nielsen y accesibilidad WCAG en un Markdown de auditoría.
7. Iterar: probar con teclado/lector de pantalla y con participantes reales.

Cada cambio de diseño debe actualizar el `README.md` y el documento de auditoría, igual que en el
concepto original.

### 1.2 Backlog y tareas

- Usa **GitHub Issues** como backlog: una tarea = un issue.
- Cada issue lleva: objetivo, criterios de aceptación, relación con una heurística o flujo y etiqueta
  (`diseño`, `frontend`, `backend`, `base de datos`, `docs`, `accesibilidad`).
- Una tarea → una rama → un Pull Request → revisión → merge.

### 1.3 Ramas

| Rama | Uso |
|---|---|
| `main` | Producción. Protegida: solo entra por PR con CI en verde. |
| `develop` (opcional) | Integración de cambios antes de producción. |
| `feature/<nombre>` | Nueva funcionalidad (catálogo, carrito, reseñas). |
| `fix/<nombre>` | Correcciones. |
| `docs/<nombre>` | Documentación y auditorías. |

Regla práctica: nunca hacer `push` directo a `main`.

### 1.4 Commits

Usa **Conventional Commits** para que el historial sea legible:

```text
feat: agregar endpoint REST de productos
fix: corregir validación del formulario de entrega
docs: actualizar auditoría de accesibilidad
refactor: extraer repositorio de pedidos
chore: configurar variables de entorno
```

Un commit = un cambio coherente. Evita commits gigantes que mezclen diseño, backend y documentación.

### 1.5 Pull Request y definición de terminado

Todo PR debe incluir:

- Descripción del cambio y el issue relacionado.
- Capturas o evidencia si afecta la interfaz.
- Pruebas locales (`npm test`) y revisión del despliegue de vista previa (Netlify preview).
- Verificación de foco visible, texto alternativo, texto grande y responsividad.
- Contrato REST documentado si se añade o cambia un endpoint.
- CI en verde y al menos una aprobación.

**Definition of Done:** código + prueba + documentación + accesibilidad + CI verde + preview revisado.

### 1.6 Ambientes y secretos

| Ambiente | Datos | URL |
|---|---|---|
| Local | Neon **branch de desarrollo** o DB local | `http://localhost:8888` con Netlify CLI |
| Preview (PR) | Neon branch por PR (opcional) | `deploy-preview-...netlify.app` |
| Producción | Neon branch `main` | dominio principal |

- Las credenciales **nunca** se suben al repositorio.
- `.env` se usa solo en local y está en `.gitignore`.
- En Netlify, `DATABASE_URL` se configura en **Site configuration → Environment variables**.
- Usa la cadena **pooler** de Neon para las Functions (serverless) y la cadena directa solo para
  migraciones/seed desde la terminal (`DATABASE_URL_DIRECT`, que no se define en Netlify).

---

## 2. Cómo se organiza el repositorio (MVC)

Estructura recomendada para el proyecto nuevo:

```text
nuevo-ecommerce/
├── .github/
│   └── workflows/
│       └── ci.yml                    # tests y build (NO publica; Netlify despliega)
├── db/
│   ├── schema.sql                    # esquema que entregas tú (referencia en §5.2)
│   ├── migrations/
│   │   └── 001_init.sql              # migraciones numeradas
│   └── seed.sql                      # datos de ejemplo
├── netlify/
│   └── functions/
│       ├── products.mjs              # CONTROLADOR REST: catálogo
│       ├── orders.mjs                # CONTROLADOR REST: checkout
│       ├── reviews.mjs               # CONTROLADOR REST: reseñas
│       └── _shared/                  # prefijo _ = no se expone como endpoint
│           ├── db.mjs                # Singleton del Pool
│           ├── http.mjs              # respuestas JSON uniformes
│           ├── middleware.mjs        # CORS, JSON, validación, errores
│           ├── repository.factory.mjs# Factory de repositorios
│           ├── products.repository.mjs
│           ├── orders.repository.mjs
│           ├── reviews.repository.mjs
│           └── order.builder.mjs     # Builder de pedidos
├── public/                           # VISTA semántica y accesible (se publica tal cual)
│   ├── index.html                    # inicio / catálogo
│   ├── product.html                  # ficha
│   ├── cart.html                     # carrito
│   ├── checkout.html                 # entrega / pago / revisión
│   ├── css/style.css                 # texto grande, responsivo, :focus-visible
│   ├── js/api.js                     # cliente de la API REST
│   ├── js/catalog.js
│   ├── js/cart.js
│   └── assets/products/              # imágenes ligeras que entregas tú (<id>-01.webp)
├── .env.example                      # plantilla sin valores reales
├── .gitignore
├── netlify.toml
├── package.json
└── README.md
```

Capas MVC:

- **Modelo (`db/` + `_shared/*.repository.mjs`):** esquema entregado, migraciones, SQL parametrizado
  y reglas de datos. Es la **única** capa que conoce `SELECT`/`INSERT`.
- **Vista (`public/`):** HTML semántico, CSS accesible y JS que solo consume la API, representa datos
  y anuncia estados.
- **Controlador (`netlify/functions/*.mjs`):** endpoint REST que pasa por middleware, valida,
  llama al repositorio mediante la Factory y responde JSON.

> Los archivos y carpetas dentro de `netlify/functions/` que empiezan con `_` se tratan como código
> compartido y **no** se exponen como endpoints. Los controladores sí quedan en
> `/.netlify/functions/<nombre>`.

### 2.1 `.gitignore`

```gitignore
node_modules/
.env
.env.*
!.env.example
.DS_Store
npm-debug.log*
*.log
.netlify/
dist/
coverage/
```

### 2.2 `package.json`

```json
{
  "name": "nuevo-ecommerce",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "netlify dev",
    "build": "node -e \"process.stdout.write('static\\n')\"",
    "test": "node --test",
    "migrate": "node db/migrate.mjs",
    "seed": "node db/seed.mjs"
  },
  "dependencies": {
    "pg": "<version actual>"
  },
  "devDependencies": {
    "netlify-cli": "<version actual>"
  }
}
```

Instala las versiones vigentes con `npm install pg` y `npm install -D netlify-cli`; no copies
números de versión fijos de esta guía.

### 2.3 Convenciones de nombres

- IDs de producto en minúsculas, sin espacios ni tildes: `cuaderno-a5`.
- Imágenes: `<id>-01.webp`, `<id>-02.webp` (la `-01` es la principal). Ver convención del concepto en
  `assets/products/README.md`.
- Tablas y columnas en `snake_case`; funciones y variables en `camelCase`.
- Repositorios: `<entidad>.repository.mjs`; controladores: `<entidad>.mjs`.
- Endpoints REST: sustantivos en plural (`/api/products`), nunca verbos (`/api/getProducts`).

### 2.4 `.env.example`

```env
# Copiar a .env y completar. NUNCA subir .env al repositorio.
DATABASE_URL=postgresql://usuario:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
# Solo para aplicar migraciones/seed desde la terminal (no configurar en Netlify):
DATABASE_URL_DIRECT=postgresql://usuario:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
PUBLIC_SITE_URL=http://localhost:8888
```

---

## 3. Cómo se usa GitHub

1. **Crear el repositorio** en GitHub con el nombre del proyecto nuevo (público o privado).
2. **Clonar** y añadir el remoto:

   ```sh
   git clone https://github.com/<usuario>/<nuevo-ecommerce>.git
   cd <nuevo-ecommerce>
   git remote -v
   ```

3. **Proteger `main`:** Settings → Branches → Branch protection rules.
   Exigir PR, revisión y que los checks de CI pasen antes de mergear.
4. **Habilitar Actions** para ejecutar `.github/workflows/ci.yml` en cada push y PR.
5. **Conectar Netlify a GitHub:** en Netlify, *Add new site → Import an existing project → GitHub* y
   autorizar el repositorio. Netlify crea un deploy por cada push y una vista previa por cada PR.
6. GitHub es la **fuente de verdad**: todo cambio entra por PR; Netlify y Neon no se editan a mano en
   producción salvo emergencias documentadas.

Ejemplo de CI (`.github/workflows/ci.yml`):

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm test
      - run: npm run build
```

> A diferencia del concepto (`pages.yml` publicaba en GitHub Pages), aquí GitHub **solo valida**;
> el despliegue lo hace Netlify.

---

## 4. Cómo se usa Netlify

### 4.1 Qué hace

- Sirve la **vista** (`public/`) como sitio estático.
- Ejecuta los **controladores REST** como Netlify Functions (Node.js serverless).
- Inyecta `DATABASE_URL` desde sus variables de entorno.
- Crea deploys automáticos desde GitHub y vistas previas por PR.

### 4.2 `netlify.toml`

```toml
[build]
  publish = "public"
  # command = "npm run build"   # solo si hay un paso real de build

[functions]
  directory = "netlify/functions"

# Ruta con parámetro (va ANTES del comodín)
[[redirects]]
  from = "/api/products/:id"
  to = "/.netlify/functions/products?id=:id"
  status = 200

# Rutas amigables generales: /api/* → Function del mismo nombre
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

La vista consume `/api/products` o `/api/products/:id`, nunca la ruta interna
`/.netlify/functions/...`. Netlify evalúa las reglas en orden: las específicas primero.

### 4.3 Variables de entorno

En Netlify: **Site configuration → Environment variables → Add a variable**:

- `DATABASE_URL` = cadena **pooler** de Neon.
- `PUBLIC_SITE_URL` = dominio principal del frontend.
- `CORS_ALLOWED_ORIGINS` = lista de orígenes permitidos, separados por comas y sin rutas.
  Ejemplo: `https://tu-tienda.netlify.app,https://www.tudominio.com`.
  En desarrollo local, incluye explícitamente `http://localhost:8888`.
- Opcional: `NODE_ENV=production`, claves de pasarela de pago, etc.
- **No** definir `DATABASE_URL_DIRECT` en Netlify: solo se usa en local para migraciones.

En local, crea `.env` (no versionado) con los mismos nombres y ejecuta:

```sh
npm install
npx netlify dev
```

`netlify dev` levanta el sitio y las Functions en `http://localhost:8888` con esas variables.

### 4.4 Verificación antes de mergear

- El preview de Netlify muestra la vista y los endpoints responden con JSON.
- En **Functions → logs** se revisan errores (`console.error` del middleware).
- El dominio y el certificado HTTPS los gestiona Netlify; no hay que configurar `server.mjs`.

---

## 5. Cómo se usa Neon

### 5.1 Crear la base de datos

1. Crear cuenta en Neon y un **project**.
2. Elegir región cercana (por ejemplo, una de AWS).
3. Crear la base `neondb` (o la que indiques en la cadena).
4. Copiar la **connection string** desde el panel; existen dos:
   - **Pooled** (host con `-pooler`): la que usa Netlify Functions → `DATABASE_URL`.
   - **Direct**: para migraciones y seed desde la terminal → `DATABASE_URL_DIRECT`.
5. Guardar la pooled como `DATABASE_URL` en Netlify y en `.env` local.
6. Neon permite **branches** de base de datos (como ramas de Git). Crea `dev` para desarrollo local y
   usa la principal para producción. Si usas branches por PR, configura la variable `DATABASE_URL`
   correspondiente en el preview.

### 5.2 Esquema: lo entregas tú

El esquema definitivo, las migraciones y los datos iniciales **los aportas tú** y se colocan en
`db/schema.sql`, `db/migrations/` y `db/seed.sql`. El código debe adaptarse a ese esquema: si una
columna se llama distinto, se ajusta el repositorio, no al revés.

El siguiente SQL es solo una **plantilla de referencia** para entender la forma del proyecto:

```sql
CREATE TABLE categories (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
  id          TEXT PRIMARY KEY,          -- mismo id que usa la vista
  name        TEXT NOT NULL,
  category_id INT REFERENCES categories(id),
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  description TEXT,
  image_url   TEXT,
  alt_text    TEXT,                      -- texto alternativo de la imagen principal
  active      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE customers (
  id     SERIAL PRIMARY KEY,
  email  TEXT NOT NULL UNIQUE,
  name   TEXT NOT NULL
);

CREATE TABLE orders (
  id           SERIAL PRIMARY KEY,
  customer_id  INT REFERENCES customers(id),
  total        NUMERIC(10,2) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pendiente',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  quantity   INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL
);

CREATE TABLE reviews (
  id         SERIAL PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Aplica **tu** esquema en la branch de desarrollo con la cadena directa:

```sh
psql "$DATABASE_URL_DIRECT" -f db/schema.sql
psql "$DATABASE_URL_DIRECT" -f db/seed.sql
```

Guarda cada cambio posterior como `db/migrations/002_....sql` (nunca edites una migración ya aplicada).

### 5.3 Buenas prácticas con Neon + serverless

- Usa siempre la cadena **pooler** en las Functions: evita agotar conexiones por cold starts.
- Reutiliza un `Pool` **Singleton** dentro de la Function (el entorno se reutiliza entre invocaciones).
- Neon exige **SSL**; configúralo en `pg`.
- Nunca pongas la cadena de conexión en el frontend ni en el repositorio.
- Las consultas van **parametrizadas** (`$1`, `$2`) dentro del repositorio para evitar inyección SQL.
- Los importes se calculan en el **backend** (Builder), nunca se confían al navegador.

---

## 6. MVC aplicado a esta stack

### 6.1 Mapa de capas, patrones y flujo de una petición

```text
Vista (public/js/*.js)               [semántica, alt, aria-live, texto grande]
   │  fetch('/api/products')
   ▼
Netlify redirect  /api/* → /.netlify/functions/:splat
   ▼
Middleware  (handleErrors → CORS → JSON → validación)
   ▼
Controlador REST (products.mjs)
   │  createRepository('products')            [Factory]
   ▼
Repository (products.repository.mjs)          [único que conoce SQL]
   │  getPool()                               [Singleton del Pool]
   ▼
Neon (PostgreSQL) → filas → JSON → Controlador → Vista
```

Patrones de diseño obligatorios en el proyecto nuevo:

| Patrón | Dónde se aplica | Para qué |
|---|---|---|
| **Singleton** | `_shared/db.mjs` | Un único `Pool` por Function; evita abrir una conexión por petición. |
| **Repository** | `*.repository.mjs` | Aísla el SQL del controlador; si cambia el esquema que entregas, solo cambia aquí. |
| **Factory** (Factory Method) | `repository.factory.mjs` | Centraliza la creación de repositorios y permite inyectar un doble en las pruebas. |
| **Builder** (creacional) | `order.builder.mjs` | Construye el pedido paso a paso y calcula el total en backend. |
| **Strategy** (extra, opcional) | `payments/` | Alterna tarjeta/transferencia sin llenar el controlador de `if`. |

### 6.2 Singleton — conexión (`_shared/db.mjs`)

```js
import pg from "pg";
const { Pool } = pg;

let pool; // una sola instancia por entorno de la Function

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10_000,
    });
  }
  return pool;
}
```

### 6.3 Repository — consultas (`_shared/products.repository.mjs`)

```js
import { getPool } from "./db.mjs";

export class ProductsRepository {
  async list({ category, q } = {}) {
    const params = [];
    const where = ["p.active = TRUE"];
    if (category) { params.push(category); where.push(`c.name = $${params.length}`); }
    if (q) { params.push(`%${q}%`); where.push(`p.name ILIKE $${params.length}`); }
    const { rows } = await getPool().query(
      `SELECT p.id, p.name, p.price, p.image_url, p.alt_text, c.name AS category
         FROM products p JOIN categories c ON c.id = p.category_id
        WHERE ${where.join(" AND ")} ORDER BY p.name`,
      params
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await getPool().query(
      `SELECT id, name, price, description, image_url, alt_text
         FROM products WHERE id = $1 AND active = TRUE`,
      [id]
    );
    return rows[0] ?? null;
  }
}
```

> Las consultas se ajustan al **esquema que entregues**. El controlador nunca escribe SQL.

### 6.4 Factory de repositorios (`_shared/repository.factory.mjs`)

```js
import { ProductsRepository } from "./products.repository.mjs";
import { OrdersRepository } from "./orders.repository.mjs";
import { ReviewsRepository } from "./reviews.repository.mjs";

const constructors = {
  products: ProductsRepository,
  orders: OrdersRepository,
  reviews: ReviewsRepository,
};

export function createRepository(name) {
  const Repository = constructors[name];
  if (!Repository) throw new Error(`Repositorio desconocido: ${name}`);
  return new Repository();
}
```

Así el controlador hace `createRepository("products")` en vez de `new ProductsRepository()` disperso.
En las pruebas se puede sustituir la entrada del mapa por un repositorio falso que devuelva datos fijos.

### 6.5 Builder — pedidos (`_shared/order.builder.mjs`)

```js
export class OrderBuilder {
  constructor(customerId) {
    this.order = { customerId, items: [] };
  }

  addItem(productId, quantity, unitPrice) {
    this.order.items.push({ productId, quantity, unitPrice });
    return this;
  }

  calculateTotal() {
    this.order.total = this.order.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    return this;
  }

  build() {
    if (!this.order.items.length) throw new Error("El pedido no tiene artículos");
    if (this.order.total == null) throw new Error("Falta calcular el total");
    return Object.freeze({ ...this.order, items: [...this.order.items] });
  }
}
```

El total y las validaciones finales ocurren aquí, en backend. El navegador puede mostrar un subtotal
informativo, pero el pedido que se guarda se construye con este Builder.

### 6.6 Middleware y respuestas (`_shared/http.mjs`, `_shared/middleware.mjs`)

`http.mjs` uniformiza el formato JSON:

```js
const baseHeaders = { "Content-Type": "application/json; charset=utf-8" };

export const json = (data, status = 200, extraHeaders = {}) => ({
  statusCode: status,
  headers: { ...baseHeaders, ...extraHeaders },
  body: JSON.stringify(data),
});
export const ok = (data, status = 200) => json(data, status);
export const fail = (status, message) => json({ error: message }, status);
```

`middleware.mjs` compone la lógica transversal **antes** del controlador:

```js
import { fail, ok } from "./http.mjs";

export function compose(...middlewares) {
  return (event, context) => {
    const ctx = { event, context };
    const run = async (i) => {
      if (i >= middlewares.length) return null;
      const result = await middlewares[i](ctx, () => run(i + 1));
      return result ?? null;
    };
    return run(0);
  };
}

export async function handleErrors(ctx, next) {
  try { return await next(); }
  catch (error) {
    console.error(error);
    return fail(500, "Error interno del servidor");
  }
}

export async function withCors(ctx, next) {
  const response = await next();
  if (!response) return null;

  // Orígenes permitidos explícitamente; nunca usar "*" en CORS.
  // En Netlify define CORS_ALLOWED_ORIGINS como una lista separada por comas.
  // Ejemplo: https://tu-tienda.netlify.app,https://www.tudominio.com
  // En local: http://localhost:8888
  const allowedOrigins = (
    process.env.CORS_ALLOWED_ORIGINS ||
    process.env.PUBLIC_SITE_URL ||
    ""
  )
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const requestOrigin = ctx.event.headers?.origin ||
    ctx.event.headers?.Origin;

  const corsHeaders = {
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  };

  // Solo se devuelve ACAO cuando el origen coincide exactamente con la lista.
  if (requestOrigin && allowedOrigins.includes(requestOrigin.replace(/\/$/, ""))) {
    corsHeaders["Access-Control-Allow-Origin"] = requestOrigin;
  }

  return {
    ...response,
    headers: {
      ...corsHeaders,
      ...response.headers,
    },
  };
}

export async function parseJson(ctx, next) {
  if (ctx.event.body) {
    try { ctx.body = JSON.parse(ctx.event.body); }
    catch { return fail(400, "JSON inválido"); }
  }
  return next();
}

export function requireFields(...names) {
  return async (ctx, next) => {
    const missing = names.filter((name) => ctx.body?.[name] == null || ctx.body[name] === "");
    if (missing.length) return fail(422, `Campos requeridos: ${missing.join(", ")}`);
    return next();
  };
}
```

Con `compose`, cada Function se define como una cadena de middleware más la lógica de la ruta.
Se pueden añadir más middleware (autenticación JWT, rate limit, logging) sin tocar los controladores.

### 6.7 Controlador REST (`products.mjs`)

```js
import { createRepository } from "./_shared/repository.factory.mjs";
import { ok, fail } from "./_shared/http.mjs";
import { compose, handleErrors, withCors, parseJson } from "./_shared/middleware.mjs";

const products = createRepository("products");

const route = async (ctx) => {
  const { httpMethod, queryStringParameters } = ctx.event;

  if (httpMethod === "OPTIONS") return ok({});
  if (httpMethod === "GET") {
    const id = queryStringParameters?.id;
    if (!id) return ok(await products.list({
      category: queryStringParameters?.category,
      q: queryStringParameters?.q,
    }));
    const product = await products.findById(id);
    return product ? ok(product) : fail(404, "Producto no encontrado");
  }
  return fail(405, "Método no permitido");
};

export const handler = compose(handleErrors, withCors, parseJson, route);
```

El controlador queda **delgado**: middleware → validación → Factory → Repository → JSON.

### 6.8 Vista accesible (`public/js/api.js` y `public/js/catalog.js`)

```js
// api.js — único punto de acceso a la API REST
export async function api(path, options = {}) {
  const res = await fetch(`/api/${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Error de red");
  return res.json();
}
export const getProducts = (params = "") => api(`products${params}`);
```

```js
// catalog.js — la vista solo renderiza; no calcula precios ni decide reglas
import { getProducts } from "./api.js";

export async function renderCatalog(list, status) {
  status.textContent = "Cargando catálogo…";
  try {
    const products = await getProducts();
    list.replaceChildren(...products.map((product) => {
      const item = document.createElement("li");
      const img = document.createElement("img");
      img.src = product.image_url || "assets/placeholder.svg";
      img.alt = product.alt_text || `Producto ${product.name}`; // texto alternativo real
      img.loading = "lazy";
      img.width = 480;
      img.height = 480;
      item.innerHTML = `
        <h3>${product.name}</h3>
        <p>${product.category}</p>
        <p>$${Number(product.price).toFixed(2)}</p>`;
      item.prepend(img);
      return item;
    }));
    status.textContent = `${products.length} productos disponibles`;
  } catch (error) {
    status.textContent = "No se pudo cargar el catálogo. Intenta de nuevo.";
    console.error(error);
  }
}
```

```html
<!-- Fragmento de index.html: semántica y anuncio de estado -->
<a class="skip-link" href="#contenido">Saltar al contenido</a>
<main id="contenido">
  <h1>Catálogo</h1>
  <p id="estado" role="status" aria-live="polite"></p>
  <ul id="productos" class="grid-productos"></ul>
</main>
```

### 6.9 Reglas de oro del MVC en esta arquitectura

1. Controlador delgado: middleware → valida → delega → responde. Sin SQL dentro.
2. Modelo con la SQL y las reglas de datos, detrás de un Repository. Sin `fetch` ni HTML.
3. Vista sin lógica de negocio: `fetch`, render accesible y mensajes de error.
4. Singleton solo para el `Pool`; Factory para crear repositorios; Builder para pedidos.
5. API REST: sustantivos en plural, verbos HTTP y códigos de estado coherentes.
6. Errores uniformes: `{ "error": "..." }` con el código HTTP adecuado.
7. El carrito puede vivir en `localStorage` (como en el concepto) o en Neon si se quiere por usuario;
   documenta cuál se elige.

---

## 7. Contrato de la API REST

### 7.1 Principios

- **Recursos**, no acciones: `/api/products`, `/api/orders`, `/api/reviews`. Los verbos los da HTTP.
- **Stateless**: cada petición trae toda la información necesaria; no hay sesión en el servidor.
- **JSON** en petición y respuesta; `Content-Type: application/json`.
- **Códigos de estado** significativos (abajo).
- **Sin estado de interfaz** en la URL: filtros y paginación van en query string
  (`?category=...&q=...&page=1`).
- Versionado opcional con prefijo `/api/v1/...` si se prevén cambios incompatibles.
- Los mensajes de error están en español y nunca exponen SQL ni credenciales.

### 7.2 Endpoints

| Método | Ruta | Uso | Respuesta |
|---|---|---|---|
| `GET` | `/api/products` | Lista con `?category=`, `?q=`, `?page=` | `200` + arreglo |
| `GET` | `/api/products/:id` | Ficha de un producto | `200` / `404` |
| `GET` | `/api/reviews?product_id=` | Reseñas de un producto | `200` + arreglo |
| `POST` | `/api/reviews` | Crear reseña (`rating` 1–5, `comment`) | `201` / `422` |
| `POST` | `/api/orders` | Crear pedido (usa `OrderBuilder`) | `201` / `422` |
| `GET` | `/api/orders/:id` | Consultar pedido | `200` / `404` |
| `OPTIONS` | cualquier ruta | Preflight CORS | `200` |

### 7.3 Códigos de estado

| Código | Uso |
|---|---|
| `200` | Lectura o acción correcta |
| `201` | Recurso creado |
| `204` | Eliminación correcta, sin cuerpo |
| `400` | JSON mal formado |
| `401` / `403` | Sin autenticación / sin permiso (si se añade login) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (por ejemplo, pedido duplicado) |
| `422` | Validación fallida (campos requeridos, rating fuera de rango) |
| `429` | Demasiadas peticiones (si se añade rate limit) |
| `500` | Error interno, registrado en logs, sin detalles sensibles |

Formato de error uniforme:

```json
{ "error": "Campos requeridos: rating, comment" }
```

### 7.4 Regla de oro

La vista **solo** consume estos endpoints. El controlador es el único que llama al repositorio; el
repositorio es el único que habla con Neon. Ninguna capa salta otra.

---

## 8. Frontend semántico y accesible

### 8.1 Semántica HTML

- Un `<h1>` por página y jerarquía de encabezados sin saltos (`h1 → h2 → h3`).
- Estructura con `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- Catálogo como lista (`<ul><li>`), no una malla de `<div>` sin significado.
- `<button>` para acciones y `<a>` para navegación; nunca `<div onclick>`.
- `<label for>` asociado a cada campo; `<fieldset>`/`<legend>` para grupos (entrega, pago).
- Resumen de pedido en `<table>` con `<caption>` y encabezados `<th scope>`.
- Confirmaciones con `<dialog>` nativo, no `window.confirm`.

### 8.2 Accesibilidad

- `lang="es"` en `<html>` y títulos descriptivos por página.
- **Texto alternativo**: cada foto de producto usa `alt` descriptivo (por ejemplo,
  `alt="Cuaderno A5 con portada botánica, vista frontal"`). El campo `alt_text` viene de Neon.
  Las imágenes puramente decorativas llevan `alt=""`.
- `aria-live="polite"` / `role="status"` para contador del carrito, resultados de búsqueda y errores.
- Errores de formulario junto al campo y enlazados con `aria-describedby`; el foco va al primer error.
- `:focus-visible` con contorno grueso y contraste suficiente en botones, enlaces y miniaturas.
- Enlace «Saltar al contenido», orden de foco lógico y navegación completa con teclado.
- Contraste AA (4.5:1 en texto normal, 3:1 en texto grande) y zoom al 200 % sin pérdida de contenido.
- `prefers-reduced-motion` para desactivar animaciones.
- Galería de fotos con miniaturas accesibles y `aria-pressed` en la seleccionada.

### 8.3 Imágenes ligeras que entregas tú

- Formato **WebP optimizado**, nombres `<id>-01.webp`, `<id>-02.webp`, en
  `public/assets/products/`. La `-01` es la principal y se usa en tarjeta y carrito.
- Peso recomendado: unas pocas decenas de KB por imagen; sin fotos pesadas sin comprimir.
- `loading="lazy"` en tarjetas, `width`/`height` explícitos para evitar saltos de layout y
  `object-fit: contain` para no recortar el producto.
- Si no hay imagen, mostrar un icono/placeholder con `alt` vacío y el nombre del producto en texto.

### 8.4 Texto grande y responsividad

```css
:root {
  font-size: 18px;        /* base legible */
  line-height: 1.6;
}
.grid-productos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1.5rem;
}
img { max-width: 100%; height: auto; object-fit: contain; }
:focus-visible { outline: 3px solid #005fcc; outline-offset: 2px; }
button, a, input, select { min-height: 44px; } /* áreas táctiles */
@media (max-width: 40rem) { :root { font-size: 16px; } }
@media (prefers-reduced-motion: reduce) { * { animation: none; transition: none; } }
```

- Diseñar móvil primero y comprobar de 320 px a escritorio.
- Ningún texto importante dentro de imágenes: todo debe poder leerse con lector de pantalla.
- Evitar justificado forzado; alineación izquierda y párrafos cortos.

### 8.5 Verificación

- Recorrido completo solo con teclado.
- Lector de pantalla (NVDA/VoiceOver) en catálogo, ficha, carrito y checkout.
- Herramienta automática (axe o Lighthouse) + revisión manual de contraste.
- Zoom 200 % y rotación de pantalla sin perder controles.

---

## 9. Recorrido de una tarea de punta a punta (ejemplo: reseñas)

1. **Issue:** «Permitir reseñas 1–5 estrellas por producto» con criterios de aceptación.
2. **Rama:** `git switch -c feature/reviews`.
3. **Modelo:** crear `reviews.repository.mjs` con `list(productId)` e `insert(productId, rating, comment)`.
4. **BD:** usar el esquema entregado; si hace falta un ajuste, migración `002_...sql` aplicada en `dev`.
5. **Factory:** registrar `reviews: ReviewsRepository` en `repository.factory.mjs`.
6. **Middleware:** aplicar `requireFields("rating", "comment")` al `POST`.
7. **Controlador:** `reviews.mjs` con `GET ?product_id=...` y `POST` que devuelve `201` o `422`.
8. **Vista:** formulario semántico en `product.html`, `aria-live` para el resultado y `alt` en miniaturas.
9. **Local:** `.env` con `DATABASE_URL` de dev → `npm run dev` → probar `http://localhost:8888`.
10. **Pruebas:** `npm test` (inyectando un repositorio falso con la Factory); verificar foco, etiquetas y mensajes de error.
11. **Commit:** `feat: agregar reseñas por producto`.
12. **PR:** CI en verde + revisar el preview de Netlify + aprobación.
13. **Merge a `main`:** Netlify despliega producción; Neon usa la branch principal.
14. **Docs:** actualizar README, contrato REST (§7) y auditoría (heurísticas 1, 3, 5 y 9).

---

## 10. Checklist para arrancar el nuevo e-commerce

- [ ] Definir usuario, objetivo y flujo de compra (5 pasos) en un Markdown.
- [ ] Crear repo en GitHub y clonarlo; proteger `main`.
- [ ] Crear la estructura MVC (`db/`, `netlify/functions/`, `public/`).
- [ ] Añadir `.gitignore`, `.env.example`, `netlify.toml`, `package.json` y `README.md`.
- [ ] Crear proyecto y branch `dev` en Neon; copiar cadenas pooler y directa.
- [ ] Definir `DATABASE_URL` y `PUBLIC_SITE_URL` en `.env` local y en Netlify.
- [ ] Colocar el **esquema, migraciones y seed que entregas** en `db/` y aplicarlos con `psql`.
- [ ] Colocar las **imágenes ligeras que entregas** en `public/assets/products/` con nombres `<id>-NN.webp`.
- [ ] Implementar Singleton (`db.mjs`), Factory, Repository y Builder.
- [ ] Implementar middleware (`handleErrors`, `withCors`, `parseJson`, `requireFields`) y `http.mjs`.
- [ ] Implementar controladores REST `products`, `orders`, `reviews` y los redirects `/api/*`.
- [ ] Documentar el contrato REST (§7) y usarlo desde `public/js/api.js`.
- [ ] Construir la vista semántica y accesible: `alt`, `aria-live`, foco visible, texto grande, responsiva.
- [ ] Probar en local con `npx netlify dev` y con lector de pantalla/teclado.
- [ ] Añadir `.github/workflows/ci.yml` (tests + build).
- [ ] Conectar Netlify al repo, verificar deploy y dominio.
- [ ] Documentar auditoría IHC/WCAG y subir evidencias.
- [ ] Repetir el ciclo issue → rama → commit → PR → merge para cada mejora.

---

## 11. Resumen rápido

- **Trabajo:** issues → ramas → commits convencionales → PR → CI → merge. Método IHC igual que el concepto.
- **Repositorio:** fuente de verdad, estructura MVC, secretos fuera (`.env` ignorado).
- **GitHub:** resguarda el código, protege `main`, ejecuta CI y dispara el despliegue en Netlify.
- **Netlify:** sirve la vista y ejecuta los controladores REST; administra env vars, redirects, preview y dominio.
- **Neon:** PostgreSQL serverless; guarda los datos con el **esquema que entregas**; se accede por repositorios.
- **API:** REST con verbos HTTP, JSON, códigos de estado y errores uniformes; la vista solo la consume.
- **Patrones:** Singleton (Pool), Repository (SQL), Factory (creación de repositorios), Builder (pedidos).
- **Backend:** lógica transversal en middleware antes del controlador; totales calculados en el Builder.
- **Frontend:** HTML semántico, `alt` descriptivo con tus imágenes ligeras, texto grande, responsivo y foco visible.
