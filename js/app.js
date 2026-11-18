// Domus Fuego — lógica del sitio (demo estática, sin backend).
// AVISO: productos, precios y disponibilidad son PROPUESTAS de demostración,
// pendientes de confirmación del propietario. No se procesan pagos ni reservas reales.

const PRODUCTS = [
  // Alitas
  { id: 'alitas-bbq', name: 'Alitas BBQ', detail: '6 alitas', price: 6.9, category: 'Alitas' },
  { id: 'alitas-jack-daniels', name: 'Alitas Jack Daniels', detail: '12 alitas', price: 12.9, category: 'Alitas' },
  { id: 'alitas-honey-mustang', name: 'Alitas Honey Mustang', detail: '24 alitas', price: 20.9, category: 'Alitas' },
  // Papas especiales
  { id: 'salchipapa', name: 'Salchipapa', price: 2.5, category: 'Papas especiales' },
  { id: 'papas-tex-mex', name: 'Papas Tex-Mex', price: 5.0, category: 'Papas especiales' },
  { id: 'papas-cheddar', name: 'Papas Cheddar', price: 6.5, category: 'Papas especiales' },
  // Nachos
  { id: 'nachos-tex-mex', name: 'Nachos Tex-Mex', detail: 'Totopos, carne molida, guacamole, pico de gallo', price: 4.0, category: 'Nachos' },
  { id: 'nachos-cheese', name: 'Nachos Cheese', detail: 'Totopos, carne molida, queso cheddar, pico de gallo y mayonesa', price: 5.0, category: 'Nachos' },
  // Hamburguesas
  { id: 'hamburguesa-simple', name: 'Hamburguesa Simple', detail: 'Carne de res, lechuga, tomate, mayonesa y queso holandés. Incluye papas fritas.', price: 5.0, category: 'Hamburguesas' },
  { id: 'hamburguesa-cheddar', name: 'Hamburguesa Cheddar', detail: 'Carne de res, lechuga, tomate, mayonesa y queso cheddar líquido. Incluye papas fritas.', price: 6.0, category: 'Hamburguesas' },
  { id: 'hamburguesa-bacon', name: 'Hamburguesa Bacon', detail: 'Carne de res, lechuga, tomate, mayonesa, queso holandés y bacon. Incluye papas fritas.', price: 6.0, category: 'Hamburguesas' },
  { id: 'hamburguesa-doble', name: 'Hamburguesa Doble', detail: '2 carnes de res, 2 quesos holandeses, lechuga, tomate, mayonesa, cebolla caramelizada y salsa de champiñón. Incluye papas fritas.', price: 9.0, category: 'Hamburguesas' },
  // Cortes uruguayos
  { id: 'picana', name: 'Picaña', detail: '250 g · incluye ensalada fresca y papas a elección', price: 18.0, category: 'Cortes uruguayos' },
  { id: 'colita-de-cuadril', name: 'Colita de cuadril', detail: '250 g · incluye ensalada fresca y papas a elección', price: 17.0, category: 'Cortes uruguayos' },
  { id: 'rib-eye', name: 'Rib eye', detail: '250 g · incluye ensalada fresca y papas a elección', price: 18.0, category: 'Cortes uruguayos' },
  // Parrilladas
  { id: 'parrillada-personal', name: 'Parrillada personal', detail: 'Filete de pollo, chuleta de lomo, chorizo y morcilla; ensalada fresca y papas a elección', price: 7.0, category: 'Parrilladas' },
  { id: 'parrillada-personal-completa', name: 'Parrillada personal completa', detail: 'Filete de pollo, chuleta de lomo, carne, chorizo y morcilla; ensalada fresca y papas a elección', price: 9.9, category: 'Parrilladas' },
  { id: 'parrillada-para-dos', name: 'Parrillada para dos', detail: '2 filetes de pollo, 2 chuletas de lomo, 2 carnes, 2 chorizos, 2 morcillas, ensalada fresca grande y papas a elección', price: 18.0, category: 'Parrilladas' },
  // Asados individuales
  { id: 'asado-pollo', name: 'Asado de pollo', detail: 'Filete de pollo, chorizo y ensalada fresca; papas a elección', price: 5.5, category: 'Asados individuales' },
  { id: 'asado-carne', name: 'Asado de carne', detail: 'Carne, chorizo y ensalada fresca; papas a elección', price: 5.5, category: 'Asados individuales' },
  { id: 'asado-cerdo', name: 'Asado de cerdo', detail: 'Chuleta de pierna, chorizo y ensalada fresca; papas a elección', price: 5.5, category: 'Asados individuales' },
  // Bebidas soft
  { id: 'gaseosa', name: 'Gaseosa', price: 1.5, category: 'Bebidas soft' },
  { id: 'te-helado', name: 'Té helado', price: 1.75, category: 'Bebidas soft' },
  { id: 'agua-mineral', name: 'Agua mineral', price: 1.5, category: 'Bebidas soft' },
  { id: 'agua-natural', name: 'Agua natural', price: 1.25, category: 'Bebidas soft' },
  // Limonadas
  { id: 'limonada-coco', name: 'Limonada de coco', price: 2.5, category: 'Limonadas' },
  { id: 'limonada-frutilla', name: 'Limonada de frutilla', price: 2.5, category: 'Limonadas' },
  { id: 'limonada-hierbabuena', name: 'Limonada de hierbabuena', price: 2.5, category: 'Limonadas' },
  { id: 'limonada-imperial', name: 'Limonada imperial', price: 2.25, category: 'Limonadas' },
  { id: 'limonada-clasica', name: 'Limonada clásica', price: 2.0, category: 'Limonadas' },
  // Jugos naturales
  { id: 'jugo-mora', name: 'Jugo de mora', price: 2.25, category: 'Jugos naturales' },
  { id: 'jugo-frutilla', name: 'Jugo de frutilla', price: 2.25, category: 'Jugos naturales' },
  { id: 'jugo-guanabana', name: 'Jugo de guanábana', price: 2.25, category: 'Jugos naturales' },
  { id: 'jugo-maracuya', name: 'Jugo de maracuyá', price: 2.25, category: 'Jugos naturales' },
  // Cervezas
  { id: 'pilsener-litro', name: 'Pilsener litro', price: 4.5, category: 'Cervezas' },
  { id: 'club-litro', name: 'Club litro', price: 5.0, category: 'Cervezas' },
  { id: 'combo-3-pilsener', name: '3 Pilsener de litro', price: 12.0, category: 'Cervezas' },
  { id: 'combo-3-club', name: '3 Club de litro', price: 13.5, category: 'Cervezas' },
  // Drinks / Cócteles
  { id: 'moscow-mule', name: 'Moscow Mule', detail: 'Vodka, ginger ale, limón y sirope simple', price: 6.0, category: 'Drinks / Cócteles' },
  { id: 'destornillador', name: 'Destornillador (Screwdriver)', detail: 'Vodka y jugo de naranja', price: 5.0, category: 'Drinks / Cócteles' },
  { id: 'vodka-tonic', name: 'Vodka Tonic', detail: 'Vodka, agua tónica y limón', price: 5.0, category: 'Drinks / Cócteles' },
  { id: 'mojito', name: 'Mojito', detail: 'Ron blanco, hierbabuena, limón, sirope simple y soda', price: 6.0, category: 'Drinks / Cócteles' },
  { id: 'cuba-libre', name: 'Cuba Libre', detail: 'Ron, Coca-Cola y limón', price: 5.0, category: 'Drinks / Cócteles' },
  { id: 'pina-colada', name: 'Piña Colada', detail: 'Ron blanco, jugo de piña, licor de coco, crema de leche y sirope simple', price: 6.0, category: 'Drinks / Cócteles' },
  { id: 'margarita', name: 'Margarita', detail: 'Tequila, limón y triple sec', price: 5.0, category: 'Drinks / Cócteles' },
  { id: 'tequila-sunrise', name: 'Tequila Sunrise', detail: 'Tequila, jugo de naranja y granadina', price: 6.0, category: 'Drinks / Cócteles' },
  { id: 'paloma', name: 'Paloma', detail: 'Tequila, refresco de toronja y limón', price: 6.0, category: 'Drinks / Cócteles' },
  { id: 'gin-tonic', name: 'Gin Tonic', detail: 'Gin, agua tónica y limón', price: 5.0, category: 'Drinks / Cócteles' },
  { id: 'tom-collins', name: 'Tom Collins', detail: 'Gin, limón, sirope simple y soda', price: 6.0, category: 'Drinks / Cócteles' },
  { id: 'gin-fizz', name: 'Gin Fizz', detail: 'Gin, limón, sirope simple, soda y clara de huevo', price: 6.0, category: 'Drinks / Cócteles' },
  { id: 'whisky-sour', name: 'Whisky Sour', detail: 'Whisky, limón y sirope simple', price: 6.0, category: 'Drinks / Cócteles' },
  { id: 'whisky-americano', name: 'Whisky Americano', detail: 'Whisky y Coca-Cola', price: 5.0, category: 'Drinks / Cócteles' },
  { id: 'highball', name: 'Highball', detail: 'Whisky y ginger ale', price: 6.0, category: 'Drinks / Cócteles' },
  { id: 'padrino', name: 'Padrino', detail: 'Whisky y amaretto', price: 6.0, category: 'Drinks / Cócteles' },
  // Vinos
  { id: 'sangria-copa', name: 'Sangría (copa)', price: 6.0, category: 'Vinos' },
  { id: 'sangria-jarra', name: 'Sangría (jarra)', price: 18.0, category: 'Vinos' },
  { id: 'tinto-de-verano', name: 'Tinto de verano', price: 5.0, category: 'Vinos' },
];

const CART_KEY = 'domusfuego-cart';
const MXN = (n) => `$${Number(n).toFixed(2)}`;

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const productGrid = $('#productGrid');
const categoryFilter = $('#categoryFilter');
const catalogUpdated = $('#catalogUpdated');
const catalogMessage = $('#catalogMessage');
const cartCount = $('#cartCount');
const cartItemCount = $('#cartItemCount');
const cartItemsList = $('#cartItems');
const emptyCart = $('#emptyCart');
const cartSubtotal = $('#cartSubtotal');
const cartTotalEl = $('#cartTotal');

// ---------- Carrito (localStorage; demo local, sin pedido real) ----------
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) ?? []; }
  catch { return []; }
}
function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  renderCart();
}
function cartQty(items) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
function cartSum(items) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
function addToCart(id) {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return;
  const items = getCart();
  const found = items.find((i) => i.id === id);
  if (found) found.quantity += 1;
  else items.push({ id, name: product.name, price: product.price, quantity: 1 });
  saveCart(items);
  setCatalogMessage(`${product.name} añadido a tu pedido (demo).`);
}
function changeQty(id, delta) {
  const items = getCart()
    .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
    .filter((i) => i.quantity > 0);
  saveCart(items);
}
function removeFromCart(id) {
  saveCart(getCart().filter((i) => i.id !== id));
}

function setCatalogMessage(msg) {
  if (catalogMessage) catalogMessage.textContent = msg;
}

function renderCart() {
  const items = getCart();
  if (cartCount) {
    cartCount.textContent = String(cartQty(items));
    cartCount.setAttribute('aria-label', `${cartQty(items)} productos`);
  }
  if (cartItemCount) cartItemCount.textContent = `${cartQty(items)} artículos`;
  if (cartSubtotal) cartSubtotal.textContent = MXN(cartSum(items));
  if (cartTotalEl) cartTotalEl.textContent = MXN(cartSum(items));
  if (emptyCart) emptyCart.hidden = items.length > 0;
  if (!cartItemsList) return;
  cartItemsList.replaceChildren(...items.map((item) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <div class="cart-item-info">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${MXN(item.price)} c/u</span>
      </div>
      <div class="cart-item-actions" role="group" aria-label="Cantidad de ${escapeHtml(item.name)}">
        <button type="button" data-action="dec" aria-label="Quitar uno">−</button>
        <span aria-live="polite">${item.quantity}</span>
        <button type="button" data-action="inc" aria-label="Añadir uno">+</button>
        <button type="button" data-action="remove" class="cart-remove">Quitar</button>
      </div>`;
    li.querySelector('[data-action="dec"]').addEventListener('click', () => changeQty(item.id, -1));
    li.querySelector('[data-action="inc"]').addEventListener('click', () => changeQty(item.id, 1));
    li.querySelector('[data-action="remove"]').addEventListener('click', () => removeFromCart(item.id));
    return li;
  }));
}

// ---------- Catálogo ----------
function renderCatalog(filter = 'all') {
  if (!productGrid) return;
  const visible = PRODUCTS.filter((p) => filter === 'all' || p.category === filter);
  productGrid.replaceChildren(...visible.map((p) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <h3>${escapeHtml(p.name)}</h3>
      ${p.detail ? `<p class="product-detail">${escapeHtml(p.detail)}</p>` : ''}
      <p class="product-meta"><span class="product-category">${escapeHtml(p.category)}</span>
      <span class="product-price">${MXN(p.price)}</span></p>
      <button type="button" class="btn btn-danger add-to-cart" data-id="${escapeHtml(p.id)}">
        Añadir al pedido
      </button>`;
    card.querySelector('.add-to-cart').addEventListener('click', () => addToCart(p.id));
    return card;
  }));
  productGrid.setAttribute('aria-busy', 'false');
  if (catalogUpdated) {
    catalogUpdated.textContent = `${visible.length} productos · Menú de demostración; precios por confirmar`;
  }
}

function populateCategories() {
  if (!categoryFilter) return;
  const categories = [...new Set(PRODUCTS.map((p) => p.category))];
  for (const cat of categories) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.append(opt);
  }
}

// ---------- Vista menú / landing ----------
const landingView = $('#landingView');
const menuView = $('#menuView');
const menuNavButton = $('#menuNavButton');

function openMenu() {
  if (!menuView || !landingView) return;
  landingView.hidden = true;
  menuView.hidden = false;
  menuNavButton?.setAttribute('aria-expanded', 'true');
  $('#menuTitle')?.focus();
  window.scrollTo({ top: 0 });
}
function closeMenu() {
  if (!menuView || !landingView) return;
  menuView.hidden = true;
  landingView.hidden = false;
  menuNavButton?.setAttribute('aria-expanded', 'false');
  menuNavButton?.focus();
}

menuNavButton?.addEventListener('click', openMenu);
$$('[data-open-menu]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); openMenu(); }));
$$('[data-close-menu]').forEach((el) => el.addEventListener('click', closeMenu));
$$('[data-landing-link]').forEach((el) => el.addEventListener('click', () => {
  if (menuView && !menuView.hidden) { menuView.hidden = true; landingView.hidden = false; }
}));

// ---------- Reserva (simulada, sin backend) ----------
const reservationForm = $('#reservationForm');
const reservationFeedback = $('#reservationFeedback');
if (reservationForm) {
  const dateInput = $('#reservationDate');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
  reservationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(reservationForm);
    const name = String(data.get('nombre') ?? '').trim();
    if (!name) return;
    reservationFeedback.hidden = false;
    reservationFeedback.innerHTML = `
      <p><strong>Solicitud recibida (demo).</strong> Gracias, ${escapeHtml(name)}.
      Esto es una simulación local: el restaurante no recibió tu reserva todavía.
      Te confirmaremos por teléfono o correo cuando el sistema de reservas esté activo.</p>`;
    reservationForm.querySelector('button[type="submit"]').disabled = true;
  });
}

// ---------- Contacto (simulado) ----------
const contactForm = $('#contactForm');
const contactFeedback = $('#contactFeedback');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!contactForm.checkValidity()) { contactForm.reportValidity(); return; }
    contactFeedback.textContent = 'Mensaje registrado en esta demo. El restaurante aún no lo recibe; escríbenos a domusfuego@gmail.com o al 0983067670.';
    contactForm.reset();
  });
}

// ---------- Utilidades ----------
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

$('#clearCart')?.addEventListener('click', () => {
  saveCart([]);
  setCatalogMessage('Carrito vaciado.');
});
categoryFilter?.addEventListener('change', (e) => renderCatalog(e.target.value));

populateCategories();
renderCatalog();
renderCart();
