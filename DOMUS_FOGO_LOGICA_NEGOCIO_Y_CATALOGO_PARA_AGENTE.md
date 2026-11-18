# DOMUS FUEGO — Brief de negocio, catálogo propuesto e instrucciones para agente de desarrollo

> **Fuente principal:** `Domus Fogo (1).pdf` (4 páginas). Este documento sirve para que un agente de programación comprenda el negocio y diseñe/implemente un sitio o sistema de restaurante coherente con la marca. **No mezclar con PichuPaper ni con la práctica independiente de API de productos.**

## 1. Antes de programar

1. Examina los archivos existentes del repositorio y preserva el trabajo previo. No sustituyas una web existente sin autorización.
2. Lee el PDF completo, incluidas las imágenes, como referencia de identidad visual y concepto comercial.
3. Separa explícitamente **hechos del PDF**, **propuestas de contenido** y **datos por confirmar**. No conviertas propuestas en afirmaciones comerciales verificadas.
4. Si el proyecto todavía no tiene alcance técnico definido, comienza por un frontend demostrativo funcional con datos de ejemplo claramente señalados. No implementes cobros reales ni afirmes que se pueden hacer reservas reales sin backend y confirmación operativa.
5. Documenta decisiones y deja el proyecto listo para versionarse en GitHub; no publiques ni uses credenciales sin permiso.

## 2. Qué afirma realmente el PDF

- **Marca:** Domus Fuego.
- **Propuesta:** «El punto de encuentro donde dos culturas se fusionan a través del fuego»; «Pasión argentina, raíces ecuatorianas y la mejor cocina al fuego» (página 1).
- **Posicionamiento:** cortes premium elegidos cuidadosamente y preparados al fuego (página 1).
- **Cocina:** énfasis en preparación a la leña, humo, llama e ingredientes de calidad; menciona filetes asados y mariscos frescos (página 2).
- **Bebida mencionada:** «Aperol Spritzo» en la pieza visual; se describe como acompañamiento de carnes blancas o carpaccio de res (página 1). Confirmar nombre comercial exacto y disponibilidad antes de publicar.
- **Presencia social indicada:** Instagram `@domusfuego` y Facebook «Domus Fuego» (página 2); verificar enlaces exactos.
- **Dirección impresa:** «García Moreno E2-55 y, 170901 Quito» (página 2). La dirección parece incompleta después de «y»; confirmar ubicación antes de mostrarla como dirección navegable.
- **Piezas visuales:** logotipo caligráfico, fotografía gastronómica, uniforme, menú y tarjeta de reserva con nombre, fecha, hora y número de personas (páginas 1–4).
- **Paleta conceptual:** BLACK, RED DEEP, WHITE y GOLD (página 1). Los códigos HEX concretos deben extraerse visualmente o elegirse como aproximación, sin afirmar que son oficiales.
- **No constan en el PDF:** carta definitiva, precios, horarios, capacidad, teléfono, método de pago, política de reservas, servicio a domicilio, disponibilidad de productos o promociones.

## 3. Modelo de negocio interpretado (hipótesis para diseño)

**Tipo de negocio:** restaurante de cocina al fuego, con enfoque en cortes de carne, platos a la parrilla y experiencia gastronómica presencial. La **reserva de mesas** es un flujo razonable porque existe una tarjeta de reserva en la identidad visual; todavía no se acredita que exista un sistema de reservas activo.

**Usuarios:** visitante, cliente, personal de atención, administrador y —si se implementa— cocina.

**Recorridos posibles:**

- Visitante explora la historia de marca → revisa el menú → consulta detalles de un plato → solicita una reserva o contacto.
- Cliente selecciona platos → revisa cantidades y observaciones → envía una **solicitud de pedido**; no afirmar que está aceptada hasta que la operación la confirme.
- Administrador gestiona categorías, productos, imágenes, precios, disponibilidad, solicitudes de reserva y estados de pedidos.
- Cocina recibe pedidos confirmados y actualiza estados de preparación, si el alcance incluye módulo operativo.

**Distinción crítica:** un restaurante con reservas y pedidos **no es necesariamente** un e-commerce con pago en línea. Presentar pago online, delivery y checkout como módulos opcionales futuros, sujetos a validación del negocio.

## 4. Catálogo de ejemplo: sugerido, NO menú oficial

Usar nombres realistas y descripciones breves, pero marcar en datos `isDemo: true` y en la interfaz «Menú de demostración; productos, precios y disponibilidad por confirmar». Los siguientes ítems son propuestas editoriales inspiradas en el concepto del PDF.

| Categoría | Producto sugerido | Descripción breve | Etiqueta |
|---|---|---|---|
| Cortes premium | Bife de chorizo a la parrilla | Corte de res con cocción al fuego | Propuesta |
| Cortes premium | Ojo de bife | Corte marmoleado a la parrilla | Propuesta |
| Cortes premium | Entraña a la brasa | Corte de res de sabor intenso | Propuesta |
| Cortes premium | Picaña al fuego | Corte de res servido en porciones | Propuesta |
| Cortes premium | Lomo fino a la parrilla | Corte tierno con punto de cocción elegible | Propuesta |
| Especialidades al fuego | Costillas ahumadas | Costillas con preparación al humo | Propuesta |
| Especialidades al fuego | Pollo a la leña | Pollo con cocción a la leña | Propuesta |
| Mariscos | Camarones a la parrilla | Camarones con preparación al fuego | Propuesta inspirada en mención genérica de mariscos |
| Mariscos | Pescado a la brasa | Pescado con guarnición de temporada | Propuesta inspirada en mención genérica de mariscos |
| Entradas | Carpaccio de res | Láminas finas de res y acompañamientos | Propuesta: el PDF menciona carpaccio como maridaje, no confirma venta |
| Entradas | Provoleta a la parrilla | Queso caliente con especias | Propuesta |
| Guarniciones | Papas rústicas | Papas doradas con hierbas | Propuesta |
| Guarniciones | Vegetales asados | Vegetales de temporada a la parrilla | Propuesta |
| Guarniciones | Ensalada fresca | Mezcla de hojas y vegetales | Propuesta |
| Bebidas | Aperol Spritz | Cóctel aperitivo | Referencia visual del PDF; confirmar nombre, carta y disponibilidad |
| Bebidas | Limonada de la casa | Bebida sin alcohol | Propuesta |
| Bebidas | Agua mineral | Agua embotellada | Propuesta |
| Postres | Flan casero | Postre tradicional | Propuesta |
| Postres | Brownie con helado | Postre de chocolate | Propuesta |

**Precios:** no asignar precios como reales. Si hacen falta para probar cálculos, usar valores ficticios en USD, marcados «DEMO», configurables desde un único archivo. Nunca inventar descuentos, certificaciones, origen específico de cortes, ingredientes alergénicos confirmados o disponibilidad.

**Campos recomendados para `products`:** `id`, `slug`, `name`, `description`, `categoryId`, `priceUsd` (nullable), `currency`, `image`, `imageAlt`, `available` (nullable), `featured`, `isDemo`, `tags`, `allergens` (vacío o «por confirmar»), `createdAt`, `updatedAt`.

**Campos para `categories`:** `id`, `name`, `slug`, `sortOrder`, `active`.

## 5. Reglas de negocio propuestas (validar con propietario)

1. Productos deshabilitados no pueden añadirse a nuevos pedidos; productos sin disponibilidad confirmada muestran «Consultar disponibilidad».
2. Cantidades enteras mayores que cero; impedir importes negativos, cantidades inválidas y campos vacíos.
3. El precio y el total se recalculan en el servidor si existe backend: jamás confiar en el importe enviado por el navegador.
4. Una reserva solicita `nombre`, `fecha`, `hora`, `personas`, `contacto`, `comentarios` opcionales y `estado` (`pendiente`, `confirmada`, `rechazada`, `cancelada`). No prometer disponibilidad en tiempo real sin un sistema de cupos.
5. Los pedidos tienen estados explícitos (`borrador`, `solicitado`, `confirmado`, `en_preparacion`, `listo`, `entregado`, `cancelado`) y registro temporal.
6. Para pedidos, registrar ítems, cantidad, precio confirmado, observaciones, subtotal y total; no almacenar datos de tarjeta.
7. Los alérgenos, puntos de cocción, guarniciones y tamaños son opciones configurables y **pendientes de confirmación**.
8. En un prototipo estático, las reservas y pedidos se simulan localmente y se etiquetan como demostración; no afirmar persistencia real ni envío al restaurante.
9. Si hay backend, aplicar validación y autorización en servidor, además de controles visuales.

## 6. Sitio sugerido: arquitectura y pantallas

Si el repositorio es nuevo, implementar **HTML, CSS y JavaScript** modular, responsive, accesible y publicable en GitHub Pages. Si existe un stack previo, adaptarse sin rehacerlo por capricho.

- **Inicio:** hero cinematográfico del fuego, mensaje de marca, botones «Explorar menú» y «Solicitar reserva», historia argentina-ecuatoriana.
- **Menú:** filtros por categoría, búsqueda, fichas de platos, fotos con texto alternativo, detalles, estado de disponibilidad y aviso DEMO.
- **Experiencia:** explicación de la cocción al fuego, imágenes del concepto, tono premium sobrio.
- **Reservas:** formulario accesible; en demo confirmar solo recepción local simulada, no reserva real.
- **Contacto:** redes del PDF, ubicación marcada «pendiente de confirmar» si se publica la dirección incompleta.
- **Panel demo opcional:** alta/edición/desactivación de productos, gestión de solicitudes, sin exponer datos personales en una web pública estática.

**Interacciones dinámicas útiles:** filtro por categorías, búsqueda, modal de producto accesible, selector de punto de cocción (solo demo), carrito o lista de pedido, cálculo de total con precios demo, formulario de reserva con validación, mensajes de estado y simulación de avance de pedido. Animaciones ligeras, compatibles con `prefers-reduced-motion`.

## 7. Identidad visual a aplicar

- Estética elegante de parrilla premium, fondos oscuros, fotografía cálida, dorado para acentos, rojo profundo para acciones selectivas, blanco para lectura.
- Usar el logotipo e imágenes del PDF solo si hay archivos reutilizables y derechos de uso apropiados; no recortar imágenes con texto como sustituto de contenido HTML accesible.
- Tipografía ornamental solo en titulares breves; textos y precios en fuente legible.
- Contraste mínimo objetivo WCAG AA (4.5:1 texto normal, 3:1 texto grande); navegación por teclado, foco visible, `label` y `alt` significativos.
- No mostrar fotografías de stock como si fueran platos reales servidos por el restaurante; etiquetar «imagen referencial» cuando corresponda.

## 8. Arquitectura de datos y API si el proyecto incluye backend

Mantener separación de capas: `routes → middleware → controllers → services → repositories → database`.

Entidades candidatas: `categories`, `products`, `reservations`, `orders`, `order_items`, `users` (solo si hay autenticación). Crear migraciones únicamente si el proyecto requiere persistencia y existe aprobación; no asumir tablas existentes.

Endpoints orientativos:

- `GET /api/categories`
- `GET /api/products?category=&q=&page=&limit=`
- `GET /api/products/:id`
- `POST /api/reservations` (solicitud, no confirmación automática)
- `POST /api/orders` (solicitud, no cobro)
- `GET /api/orders/:id` con autorización adecuada
- CRUD administrativo de productos y reservas protegido por autenticación y roles

No introducir pasarelas de pago, autenticación de producción, proveedores de entrega ni integración real con redes sin necesidad y aprobación. GitHub Pages solo aloja frontend estático: un backend real requiere hosting separado.

## 9. Entregables obligatorios para el agente

1. Código fuente completo, no solo propuestas.
2. `README.md` con propósito, fuente de identidad, distinción entre hechos/propuestas, instalación y uso.
3. Datos de ejemplo en JSON o semillas; productos claramente identificados como **propuestos**.
4. Diseño adaptable a móvil, tablet y escritorio.
5. Accesibilidad básica y controles de teclado.
6. Pruebas de funcionalidades y registro honesto de resultados; si no se ejecutaron, decirlo.
7. Guía para subir a GitHub y, si es frontend estático, activar GitHub Pages.
8. `PENDIENTES_NEGOCIO.md` con preguntas al propietario: carta real, precios, horarios, reservas, dirección completa, contacto, fotos, políticas, delivery y pagos.
9. No modificar ni borrar archivos ajenos al alcance; no subir secretos al repositorio.

## 10. Instrucción final de ejecución

> Lee `Domus Fogo (1).pdf` y este Markdown. Primero identifica el proyecto existente y su tecnología. Comprende la marca y su lógica de restaurante al fuego. Implementa la web o adapta la existente con catálogo de demostración, categorías, experiencia gastronómica y reservas simuladas, respetando la estética del PDF. No afirmes que los productos sugeridos son la carta oficial. Haz todo lo técnicamente posible, ejecuta las pruebas disponibles y deja el repositorio listo para GitHub. Solicita mi intervención únicamente para decisiones comerciales, accesos y permisos imprescindibles.
