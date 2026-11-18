// Domus Fuego — lógica del sitio.
// Catálogo, pedidos y reservas persisten en Neon vía /api/* (Netlify Functions).
// Productos y precios son DEMO, pendientes de confirmación del propietario.

const CART_KEY = 'domusfuego-cart';
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const MXN = (n) => `$${Number(n).toFixed(2)}`;

async function api(path, options = {}) {
  const res = await fetch(`/api/${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error de red');
  return data;
}

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

let PRODUCTS = [];

// ---------- Carrito (localStorage; el total se recalcula en el servidor) ----------
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) ?? []; }
  catch { return []; }
}
function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  renderCart();
}
const cartQty = (items) => items.reduce((s, i) => s + i.quantity, 0);
const cartSum = (items) => items.reduce((s, i) => s + i.price * i.quantity, 0);

function addToCart(id) {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return;
  const items = getCart();
  const found = items.find((i) => i.id === id);
  if (found) found.quantity += 1;
  else items.push({ id, name: product.name, price: Number(product.precio), quantity: 1 });
  saveCart(items);
  setCatalogMessage(`${product.name} añadido a tu pedido.`);
}
function changeQty(id, delta) {
  saveCart(getCart().map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i)).filter((i) => i.quantity > 0));
}
const removeFromCart = (id) => saveCart(getCart().filter((i) => i.id !== id));
const setCatalogMessage = (msg) => { if (catalogMessage) catalogMessage.textContent = msg; };

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

// ---------- Catálogo (API) ----------
async function loadCatalog(params = '') {
  const products = await api(`products${params}`);
  PRODUCTS = products;
  return products;
}

function renderCatalog(filter = 'all') {
  if (!productGrid) return;
  const visible = PRODUCTS.filter((p) => filter === 'all' || p.category === filter);
  productGrid.replaceChildren(...visible.map((p) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <h3>${escapeHtml(p.name)}</h3>
      <p class="product-meta"><span class="product-category">${escapeHtml(p.category)}</span>
      <span class="product-price">${MXN(p.precio)}</span></p>
      <button type="button" class="btn btn-danger add-to-cart" data-id="${p.id}">Añadir al pedido</button>`;
    card.querySelector('.add-to-cart').addEventListener('click', () => addToCart(p.id));
    return card;
  }));
  productGrid.setAttribute('aria-busy', 'false');
  if (catalogUpdated) catalogUpdated.textContent = `${visible.length} productos · Demo`;
}

async function initCatalog() {
  try {
    const categories = await api('products?meta=categories');
    if (categoryFilter) {
      for (const cat of categories) {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categoryFilter.append(opt);
      }
    }
    await loadCatalog();
    renderCatalog();
  } catch (error) {
    console.error(error);
    if (catalogUpdated) catalogUpdated.textContent = 'No se pudo cargar el catálogo.';
    setCatalogMessage(error.message || 'No se pudo cargar el catálogo. Intenta de nuevo.');
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

// ---------- Checkout (crea el pedido en la base de datos) ----------
const checkoutDialog = $('#checkoutDialog');
const checkoutForm = $('#checkoutForm');
const checkoutFeedback = $('#checkoutFeedback');

$('#checkoutButton')?.addEventListener('click', () => {
  if (!getCart().length) { setCatalogMessage('Tu carrito está vacío.'); return; }
  checkoutDialog?.showModal();
});
$('#cancelCheckout')?.addEventListener('click', () => checkoutDialog?.close());

checkoutForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(checkoutForm);
  const telefono = String(data.get('telefono') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  if (!telefono && !email) {
    checkoutFeedback.innerHTML = '<p role="alert">Indica un teléfono o un correo para confirmar el pedido.</p>';
    return;
  }
  const payload = {
    customer: {
      name: String(data.get('nombre') ?? '').trim(),
      email: String(data.get('email') ?? '').trim() || undefined,
      phone: String(data.get('telefono') ?? '').trim() || undefined,
    },
    items: getCart().map((i) => ({ product_id: i.id, quantity: i.quantity })),
  };
  try {
    const order = await api('orders', { method: 'POST', body: JSON.stringify(payload) });
    saveCart([]);
    checkoutFeedback.innerHTML = `<p><strong>¡Pedido recibido!</strong> Número de pedido: <strong>#${order.id}</strong>. Total: ${MXN(order.total)}. Te contactaremos para confirmar.</p>`;
    checkoutForm.querySelector('button[type="submit"]').disabled = true;
  } catch (error) {
    checkoutFeedback.innerHTML = `<p role="alert">${escapeHtml(error.message)}</p>`;
  }
});

// ---------- Reserva (crea la reserva en la base de datos) ----------
const reservationForm = $('#reservationForm');
const reservationFeedback = $('#reservationFeedback');
if (reservationForm) {
  const dateInput = $('#reservationDate');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
  reservationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(reservationForm);
    const payload = {
      customer: (() => {
        const contacto = String(data.get('contacto') ?? '').trim();
        const isEmail = contacto.includes('@');
        return {
          name: String(data.get('nombre') ?? '').trim(),
          email: isEmail ? contacto : undefined,
          phone: isEmail ? undefined : contacto,
        };
      })(),
      fecha: data.get('fecha'),
      hora: data.get('hora'),
      comensales: Number(data.get('personas')),
    };
    try {
      const reservation = await api('reservations', { method: 'POST', body: JSON.stringify(payload) });
      reservationFeedback.hidden = false;
      reservationFeedback.innerHTML = `
        <p><strong>Solicitud recibida.</strong> Reserva <strong>#${reservation.id}</strong> · mesa ${escapeHtml(reservation.mesa)} · estado: ${escapeHtml(reservation.status)}.
        El restaurante te confirmará por el contacto indicado.</p>`;
      reservationForm.querySelector('button[type="submit"]').disabled = true;
    } catch (error) {
      reservationFeedback.hidden = false;
      reservationFeedback.innerHTML = `<p role="alert">${escapeHtml(error.message)}</p>`;
    }
  });
}

// ---------- Contacto (sin backend; mensaje honesto) ----------
const contactForm = $('#contactForm');
const contactFeedback = $('#contactFeedback');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!contactForm.checkValidity()) { contactForm.reportValidity(); return; }
    contactFeedback.textContent = 'Aún no hay mensajería integrada: escríbenos a domusfuego@gmail.com o al 0983067670.';
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
categoryFilter?.addEventListener('change', (e) => {
  const opt = e.target.selectedOptions[0];
  renderCatalog(!opt || opt.value === 'all' ? 'all' : opt.value);
});

initCatalog();
renderCart();
