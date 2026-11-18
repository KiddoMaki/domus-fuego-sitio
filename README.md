# Domus Fuego — Sitio web y catálogo de demostración

> **Estado:** frontend estático de demostración. Sin backend, sin pagos reales y sin reservas reales.
> Basado en el brief `DOMUS_FOGO_LOGICA_NEGOCIO_Y_CATALOGO_PARA_AGENTE.md` y la identidad descrita en
> `GUIA_NUEVO_ECOMMERCE_MVC_CORS_CORREGIDO.md` (arquitectura MVC propuesta para una fase con backend, aún no aprobada).

## Qué es

Sitio del restaurante **Domus Fuego** (parrilla, steakhouse y BBQ): historia de marca, carta de la casa,
carrito/pedido de demostración, formulario de reserva simulado y contacto.

## Hechos del PDF vs. propuestas (IMPORTANTE)

**Hechos declarados en el material de marca:** nombre «Domus Fuego», tagline «El punto de encuentro donde
dos culturas se fusionan a través del fuego», enfoque en cocina al fuego/leña, Instagram `@domusfuego`,
dirección impresa «García Moreno E2-55 y, 170901 Quito» (incompleta, por confirmar), paleta conceptual
BLACK / RED DEEP / WHITE / GOLD.

**Propuestas editoriales (NO son la carta oficial):** todos los productos, precios, disponibilidad,
combos, cócteles y horarios mostrados en el sitio. Están marcados en la interfaz como
«Menú de demostración; productos, precios y disponibilidad por confirmar». Los precios se configuran en un
único archivo (`js/app.js`, arreglo `PRODUCTS`).

## Estructura

```text
index.html              # Sitio completo (landing, menú/catálogo, carrito demo, reserva, contacto)
styles.css              # Estilos (oscuro premium, dorado, accesible)
js/app.js               # Catálogo demo + carrito (localStorage) + formularios simulados
assets/DFLOGO.svg       # Logo provisional (generado; reemplazar por el oficial con derechos de uso)
GUIA_NUEVO_ECOMMERCE_MVC_CORS_CORREGIDO.md   # Guía de la fase con backend (Netlify + Neon), no implementada
DOMUS_FOGO_LOGICA_NEGOCIO_Y_CATALOGO_PARA_AGENTE.md  # Brief de negocio y catálogo propuesto
PENDIENTES_NEGOCIO.md   # Preguntas para el propietario
```

## Uso local

Cualquier servidor estático sirve el sitio, por ejemplo:

```sh
python3 -m http.server 8080
# abrir http://localhost:8080
```

No hay dependencias ni build.

## Accesibilidad

- `lang="es"`, un `h1` por vista, enlaces «Saltar al contenido», foco visible (`:focus-visible`),
  `aria-live="polite"` en carrito/estados, navegación completa por teclado, contraste AA y
  `prefers-reduced-motion` respetado.

## Limitaciones conocidas

- Reservas y pedidos son **simulaciones locales** (localStorage); no se envían a ningún lado.
- El carrito no persiste entre dispositivos ni genera pedidos reales.
- No hay autenticación, pagos ni panel administrativo.
- La dirección y datos de contacto impresos en el PDF están sin confirmar (ver `PENDIENTES_NEGOCIO.md`).

## Publicación (GitHub Pages)

1. `git init && git add . && git commit -m "feat: sitio demo Domus Fuego"`
2. Crear el repo en GitHub y `git push -u origin main`
3. GitHub → Settings → Pages → Source: rama `main`, carpeta `/ (root)`

## Fase 2 (con backend, NO implementada)

La guía `GUIA_NUEVO_ECOMMERCE_MVC_CORS_CORREGIDO.md` describe la arquitectura objetivo
(Netlify Functions + Neon/PostgreSQL, MVC, API REST `/api/products|orders|reviews`, patrones
Singleton/Factory/Repository/Builder). Requiere aprobación del propietario, cuenta de Neon y de Netlify,
y el esquema SQL definitivo. No se implementó por ahora.
