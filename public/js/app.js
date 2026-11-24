// Domus Fuego — SPA con vistas dentro del mismo HTML.
// Modelo → Servicio → Controlador → Ruta en el backend; aquí solo se consume /api.

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const USD = (value) => `$${Number(value).toFixed(2)}`;
const TOKEN_KEY = "domusfuego-token";
const USER_KEY = "domusfuego-user";
const A11Y_PUBLIC_KEY = "domusfuego-a11y-public";

let token = localStorage.getItem(TOKEN_KEY);
let user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
let products = [];
let catalogLoaded = false;
let pendingView = null;

async function api(path, options = {}) {
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api/${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearAuth();
    showView("auth");
  }
  if (!response.ok) throw new Error(data.error || "No se pudo completar la solicitud");
  return data;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
}

function prefersReducedMotion() {
  const root = document.documentElement;
  return root.classList.contains("a11y-reduced") || root.classList.contains("a11y-none")
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initPublicAccessibility() {
  const root = document.documentElement;
  const saved = JSON.parse(localStorage.getItem(A11Y_PUBLIC_KEY) || "{}");
  const fab = $("#a11yFab");
  const panel = $("#a11yPublicPanel");
  const large = $("#a11yPublicLarge");
  const contrast = $("#a11yPublicContrast");
  const reduced = $("#a11yPublicReduced");
  const speed = $("#a11yPublicSpeed");
  if (!fab || !panel || !large || !contrast || !reduced || !speed) return;

  large.checked = Boolean(saved.large);
  contrast.checked = Boolean(saved.contrast);
  reduced.checked = Boolean(saved.reduced);
  speed.value = ["normal", "lenta", "sin"].includes(saved.speed) ? saved.speed : "normal";

  const apply = (announce = false) => {
    root.classList.toggle("a11y-large", large.checked);
    root.classList.toggle("a11y-contrast", contrast.checked);
    root.classList.toggle("a11y-reduced", reduced.checked);
    root.classList.toggle("a11y-slow", speed.value === "lenta");
    root.classList.toggle("a11y-none", speed.value === "sin");
    localStorage.setItem(A11Y_PUBLIC_KEY, JSON.stringify({
      large: large.checked, contrast: contrast.checked,
      reduced: reduced.checked, speed: speed.value,
    }));
    if (announce) $("#publicA11yStatus").textContent = "Preferencias de accesibilidad actualizadas.";
  };
  [large, contrast, reduced, speed].forEach((control) => {
    control.addEventListener("change", () => apply(true));
  });
  apply();

  fab.addEventListener("click", () => {
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    fab.setAttribute("aria-expanded", String(willOpen));
  });
  document.addEventListener("click", (event) => {
    if (panel.hidden) return;
    if (panel.contains(event.target) || fab.contains(event.target)) return;
    panel.hidden = true;
    fab.setAttribute("aria-expanded", "false");
  });
}

// ---------- Vistas ----------
function showView(name, anchor) {
  if (name === "cuenta" && !token) {
    pendingView = name;
    name = "auth";
  }

  $$(".view").forEach((view) => {
    view.hidden = view.dataset.view !== name;
  });
  $$("a[data-view], button[data-view]").forEach((link) => {
    link.classList.toggle("active", link.dataset.view === name);
  });

  window.scrollTo({ top: 0, behavior: "auto" });
  const target = $(`#view-${name} h1, #view-${name} h2`);
  target?.focus?.({ preventScroll: true });

  if (name === "carta" && !catalogLoaded) initCatalog();
  if (name === "cuenta" && token) loadHistory();
  if (name === "landing" && anchor) {
    requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    });
  }
}

$$("a[data-view], button[data-view]").forEach((element) => {
  element.addEventListener("click", (event) => {
    event.preventDefault();
    const collapse = bootstrap.Collapse.getInstance($("#mainNavigation"));
    collapse?.hide();
    showView(element.dataset.view, element.dataset.anchor);
  });
});

// ---------- Autenticación ----------
function saveAuth(session) {
  token = session.token;
  user = session.user;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  updateAuthUI();
}

function clearAuth() {
  token = null;
  user = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  updateAuthUI();
}

const isAdmin = () => Boolean(user?.roles?.includes("ADMINISTRADOR"));

function updateAuthUI() {
  const button = $("#authButton");
  if (!button) return;
  button.innerHTML = token
    ? '<i class="bi bi-person-circle me-1" aria-hidden="true"></i>Mi cuenta'
    : '<i class="bi bi-box-arrow-in-right me-1" aria-hidden="true"></i>Iniciar sesión';
}

$("#authButton")?.addEventListener("click", () => {
  if (isAdmin()) {
    window.location.assign("/admin.html");
    return;
  }
  showView(token ? "cuenta" : "auth");
});

$("#showLogin")?.addEventListener("click", () => {
  $("#loginForm").hidden = false;
  $("#registerForm").hidden = true;
  $("#showLogin").classList.add("active");
  $("#showRegister").classList.remove("active");
  $("#authFeedback").textContent = "";
});

$("#showRegister")?.addEventListener("click", () => {
  $("#loginForm").hidden = true;
  $("#registerForm").hidden = false;
  $("#showRegister").classList.add("active");
  $("#showLogin").classList.remove("active");
  $("#authFeedback").textContent = "";
});

$("#loginForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  try {
    saveAuth(await api("auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: data.get("email"),
        password: data.get("password"),
      }),
    }));
    afterAuth();
  } catch (error) {
    $("#authFeedback").textContent = error.message;
  }
});

$("#registerForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  try {
    saveAuth(await api("auth/register", {
      method: "POST",
      body: JSON.stringify({
        nombre: data.get("nombre"),
        email: data.get("email"),
        password: data.get("password"),
      }),
    }));
    afterAuth();
  } catch (error) {
    $("#authFeedback").textContent = error.message;
  }
});

$("#logoutButton")?.addEventListener("click", () => {
  clearAuth();
  showView("landing");
});

// Después de iniciar sesión, los administradores entran al panel; los clientes
// retoman la vista pendiente y su borrador de reserva.
function afterAuth() {
  if (isAdmin()) {
    window.location.assign("/admin.html");
    return;
  }
  const destination = pendingView || "reservas";
  pendingView = null;
  showView(destination);
  if (destination === "reservas") restoreReservationDraft();
}

function restoreReservationDraft() {
  const raw = sessionStorage.getItem("domusfuego-reservation-draft");
  if (!raw) return;
  sessionStorage.removeItem("domusfuego-reservation-draft");
  try {
    const draft = JSON.parse(raw);
    const form = $("#reservationForm");
    Object.entries(draft).forEach(([name, value]) => {
      const field = form?.elements[name];
      if (field && value != null) field.value = value;
    });
    $("#reservationFeedback").textContent =
      "Tus datos están listos. Confirma la reserva para continuar.";
  } catch {
    // Si el borrador no es válido, simplemente se descarta.
  }
}

// ---------- Carta ----------
function renderProducts(filter = "all") {
  const grid = $("#productGrid");
  if (!grid) return;

  const visible = filter === "all"
    ? products
    : products.filter((product) => product.category === filter);

  grid.replaceChildren(...visible.map((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.imageAlt || product.name)}" loading="lazy" />
      <div class="product-content">
        <p class="product-category">${escapeHtml(product.category)}</p>
        <h3>${escapeHtml(product.name)}</h3>
        <p class="product-description">${escapeHtml(product.description || "")}</p>
        <div class="product-buy-row"><span class="product-price">${USD(product.price)}</span></div>
      </div>`;
    return card;
  }));

  grid.setAttribute("aria-busy", "false");
  $("#catalogUpdated").textContent = `${visible.length} ${visible.length === 1 ? "producto" : "productos"}`;
}

async function initCatalog() {
  catalogLoaded = true;
  try {
    const [items, categories] = await Promise.all([
      api("products?limit=100"),
      api("products?meta=categories"),
    ]);
    products = items;

    const filter = $("#categoryFilter");
    for (const name of categories) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      filter.append(option);
    }
    filter.addEventListener("change", (event) => renderProducts(event.target.value || "all"));
    renderProducts();
  } catch (error) {
    $("#productGrid")?.setAttribute("aria-busy", "false");
    $("#catalogUpdated").textContent = "Catálogo no disponible";
    $("#catalogMessage").textContent = error.message;
  }
}

// ---------- Reservas e historial ----------
const fechaInput = $("#reservationFecha");
if (fechaInput) fechaInput.min = new Date().toISOString().slice(0, 10);

$("#reservationForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);

  // La vista es pública; el inicio de sesión se pide solo al confirmar.
  if (!token) {
    sessionStorage.setItem(
      "domusfuego-reservation-draft",
      JSON.stringify({
        fecha: data.get("fecha"),
        hora: data.get("hora"),
        comensales: data.get("comensales"),
        telefono: data.get("telefono"),
        observaciones: data.get("observaciones"),
      })
    );
    pendingView = "reservas";
    $("#authFeedback").textContent =
      "Inicia sesión o crea una cuenta para confirmar tu reserva.";
    showView("auth");
    return;
  }

  try {
    const result = await api("reservations", {
      method: "POST",
      body: JSON.stringify({
        customer: {
          name: user?.nombre || "Cliente",
          email: user?.email || undefined,
          phone: data.get("telefono") || undefined,
        },
        fecha: data.get("fecha"),
        hora: data.get("hora"),
        comensales: Number(data.get("comensales")),
        observaciones: data.get("observaciones") || undefined,
      }),
    });
    $("#reservationFeedback").textContent =
      `Reserva #${result.id} confirmada en la mesa ${result.mesa}. Estado: ${result.status}.`;
    $("#reservationSuccessDetail").textContent =
      `Reserva #${result.id} para el ${data.get("fecha")} a las ${data.get("hora")}, ` +
      `mesa ${result.mesa}, ${result.capacidad} comensales. Estado: ${result.status}.`;
    bootstrap.Modal.getOrCreateInstance($("#reservationSuccessModal")).show();
    event.currentTarget.reset();
    if (fechaInput) fechaInput.min = new Date().toISOString().slice(0, 10);
  } catch (error) {
    $("#reservationFeedback").textContent = error.message;
  }
});

// Al cerrar la ventana de confirmación se abre la parte del historial.
$("#reservationSuccessModal")?.addEventListener("hidden.bs.modal", () => {
  showView("cuenta");
});

function renderHistory(container, rows, emptyMessage) {
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = `<p class="catalog-updated">${emptyMessage}</p>`;
    return;
  }
  const list = document.createElement("ul");
  list.className = "history-items";
  rows.forEach((row) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>${escapeHtml(row.fecha)} · ${escapeHtml(String(row.hora).slice(0, 5))}</strong>
      <span>Mesa ${escapeHtml(row.mesa)} · ${escapeHtml(row.comensales)} comensales · ${escapeHtml(row.estado)}</span>`;
    list.append(item);
  });
  container.replaceChildren(list);
}

async function loadHistory() {
  try {
    const [history, profile] = await Promise.all([
      api("reservations/history"),
      api("auth/me"),
    ]);
    user = profile;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    $("#cuentaNombre").textContent = `${profile.nombre} · ${profile.email}`;
    renderHistory($("#vigentesList"), history.vigentes, "No tienes reservas vigentes.");
    renderHistory($("#historialList"), history.historial, "Aún no hay reservas anteriores.");
  } catch (error) {
    $("#vigentesList").textContent = error.message;
    $("#historialList").textContent = error.message;
  }
}

initPublicAccessibility();
updateAuthUI();
showView("landing");
