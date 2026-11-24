// Panel administrativo de Domus Fuego.
// La interfaz viene del repositorio domus-admin; aquí se conecta a /api/admin.
// Todos los datos se precargan una sola vez: cambiar de pestaña solo renderiza
// el cache, sin peticiones ni valores demostrativos que "cambien" de un módulo a otro.

const titles = {
    'dashboard': 'Resumen Ejecutivo',
    'inventario': 'Módulo: Catálogo e Items',
    'compras': 'Módulo: Compras & Proveedores',
    'produccion': 'Módulo: Producción & Recetas',
    'sala': 'Módulo: Mesas & Reservas',
    'ventas': 'Módulo: Pedidos, Ventas & Caja',
    'contabilidad': 'Módulo: Finanzas & Gastos',
    'er_model': 'Diagrama Entidad-Relación',
    'auditoria': 'Seguridad: Auditoría & Bitácora',
    'usuarios': 'Módulo: Usuarios & Roles'
};

function toggleSidebar(open) {
    const sidebar = document.getElementById('mainSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (open) {
        sidebar.classList.add('open');
        backdrop.classList.add('active');
    } else {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
    }
}

function activateModule(moduleKey, triggerBtn) {
    document.querySelectorAll('.module-view').forEach((el) => el.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach((btn) => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });
    const target = document.getElementById(moduleKey);
    if (target) target.classList.add('active');
    const bc = document.getElementById('moduleBreadcrumb');
    if (bc) bc.textContent = titles[moduleKey] || 'Módulo Administrativo';
    const button = triggerBtn || document.querySelector(`.nav-link[aria-controls="${moduleKey}"]`);
    if (button) {
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
    }
    if (titles[moduleKey]) sessionStorage.setItem(ACTIVE_TAB_KEY, moduleKey);
}

function switchTab(moduleKey, triggerBtn) {
    activateModule(moduleKey, triggerBtn);
    if (window.innerWidth <= 992) toggleSidebar(false);
    loadModule(moduleKey);
}

// ---------- Sesión y acceso a la API ----------
const TOKEN_KEY = 'domusfuego-token';
const USER_KEY = 'domusfuego-user';
const A11Y_KEY = 'domusfuego-admin-a11y';
const ACTIVE_TAB_KEY = 'domusfuego-admin-active-tab';
const token = localStorage.getItem(TOKEN_KEY);
const currentUser = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
const isAdmin = Boolean(token && currentUser?.roles?.includes('ADMINISTRADOR'));

if (!isAdmin) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.replace('/');
}

async function adminApi(path, options = {}) {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`/api/admin/${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.replace('/');
        throw new Error('Sesión sin permisos de administrador');
    }
    if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación');
    return data;
}

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const fmt = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('es-EC', {
        dateStyle: 'medium', timeStyle: 'short',
    });
};

const money = (value) => `$${Number(value ?? 0).toFixed(2)}`;

function pill(state) {
    const value = String(state ?? '').toLowerCase();
    const active = ['confirmada', 'activo', 'abierto', 'abierta', 'pagado', 'pagada',
        'listo', 'entregado', 'recibida', 'completa', 'terminada', 'servido',
        'cerrada', 'cerrado', 'aprobado', 'disponible'].includes(value);
    const pending = ['pendiente', 'en_preparacion', 'planificada', 'en_proceso',
        'parcial'].includes(value);
    const tone = active ? 'active' : pending ? 'pending' : 'cancelled';
    return `<span class="status-pill ${tone}">${esc(String(state ?? '—').replace(/_/g, ' '))}</span>`;
}

function setMetric(section, index, value) {
    const node = document.querySelectorAll(`#${section} .metric-value`)[index];
    if (node) node.textContent = value;
}

function ensureActions(section) {
    const head = document.querySelector(`#${section} .admin-table thead tr`);
    if (head && !head.querySelector('[data-actions]')) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.dataset.actions = 'true';
        th.textContent = 'Acciones';
        head.appendChild(th);
    }
}

function renderRows(section, html, emptyMessage = 'No hay registros en este módulo.') {
    const tbody = document.querySelector(`#${section} .admin-table tbody`);
    if (!tbody) return;
    const colspan = document.querySelectorAll(`#${section} .admin-table thead th`).length;
    tbody.innerHTML = html || `<tr><td class="table-empty" colspan="${colspan}">${esc(emptyMessage)}</td></tr>`;
}

// ---------- Precarga única de datos reales ----------
const dataEndpoints = {
    overview: 'overview',
    reservations: 'reservations',
    catalog: 'catalog',
    inventory: 'inventory',
    purchases: 'purchases',
    production: 'production',
    orders: 'orders',
    users: 'users',
    finance: 'finance',
    cash: 'cash',
    sales: 'sales',
    audit: 'audit',
    mesas: 'data/mesa',
};

const cache = Object.create(null);
const loadErrors = Object.create(null);

function toggleLoading(show) {
    const overlay = document.getElementById('adminLoading');
    if (overlay) overlay.hidden = !show;
    const content = document.getElementById('contenidoPrincipal');
    if (content) content.setAttribute('aria-busy', String(show));
    const status = document.getElementById('adminStatus');
    if (status && show) status.textContent = 'Cargando datos reales del restaurante…';
}

async function preloadAll() {
    toggleLoading(true);
    const entries = Object.entries(dataEndpoints);
    const results = await Promise.allSettled(
        entries.map(([, path]) => adminApi(path))
    );
    results.forEach((result, index) => {
        const key = entries[index][0];
        if (result.status === 'fulfilled') {
            cache[key] = result.value;
            delete loadErrors[key];
        } else {
            loadErrors[key] = result.reason?.message || 'Error desconocido';
        }
    });
    toggleLoading(false);
    const failed = Object.keys(loadErrors);
    const status = document.getElementById('adminStatus');
    if (status) {
        status.textContent = failed.length
            ? `Panel listo con ${failed.length} módulo(s) sin datos: ${failed.join(', ')}.`
            : 'Datos reales cargados correctamente.';
    }
    if (failed.length) toast(`No se pudieron cargar: ${failed.join(', ')}`);
}

const rowsOf = (key) => (Array.isArray(cache[key]) ? cache[key] : []);
const summary = () => (cache.overview && typeof cache.overview === 'object' ? cache.overview : {});

function renderModule(key) {
    const renderers = {
        dashboard: renderDashboard,
        inventario: renderCatalog,
        compras: renderPurchases,
        produccion: renderProduction,
        sala: renderRooms,
        ventas: renderSales,
        contabilidad: renderAccounting,
        usuarios: renderUsers,
        auditoria: renderAudit,
        er_model: renderErModel,
    };
    try {
        renderers[key]?.();
    } catch (error) {
        toast(error.message);
    }
}

async function loadModule(key) {
    renderModule(key);
}

async function refreshActive() {
    await preloadAll();
    renderModule(document.querySelector('.module-view.active')?.id || 'dashboard');
}

function renderDashboard() {
    const s = summary();
    setMetric('dashboard', 0, money(s.salesTotal ?? 0));
    setMetric('dashboard', 1, String(s.openCash ?? 0));
    setMetric('dashboard', 2, String(s.activeProduction ?? 0));
    setMetric('dashboard', 3, `${s.activeReservations ?? 0} reservas`);

    const movements = [
        ...rowsOf('reservations').slice(0, 4).map((r) => [
            `#R-${r.id}`, 'Reservas', `Reserva de ${esc(r.cliente)} · mesa ${esc(r.mesa)}`,
            `${r.comensales} pers.`, `${fmt(r.fecha)} ${String(r.hora).slice(0, 5)}`, pill(r.estado),
        ]),
        ...rowsOf('orders').slice(0, 4).map((o) => [
            `#P-${o.id}`, 'Pedidos', `Pedido #${o.id} · reserva ${o.idReserva ?? '—'}`,
            money(o.total), fmt(o.fecha), pill(o.estado),
        ]),
        ...rowsOf('sales').slice(0, 4).map((v) => [
            `#V-${v.id_venta}`, 'Ventas', `Pedido #${v.id_pedido} · ${esc(v.medios)}`,
            money(v.total), fmt(v.fecha_venta), pill(v.estado),
        ]),
        ...rowsOf('finance').slice(0, 4).map((a) => [
            `#A-${a.id_movimiento_contable}`, 'Contabilidad', esc(a.detalle),
            `${Number(a.signo) > 0 ? '+' : '−'}${money(a.monto)}`, fmt(a.fecha),
            `<span class="status-pill ${Number(a.signo) > 0 ? 'active' : 'cancelled'}">${Number(a.signo) > 0 ? 'Ingreso' : 'Egreso'}</span>`,
        ]),
    ];
    ensureActions('dashboard');
    renderRows('dashboard', movements.map((cells) =>
        `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}<td></td></tr>`).join(''));
}

function renderCatalog() {
    const lots = rowsOf('inventory');
    const s = summary();
    setMetric('inventario', 0, String(s.items ?? rowsOf('catalog').length));
    setMetric('inventario', 1, String(s.lotsExpiring ?? 0));
    setMetric('inventario', 2, money(lots.reduce((sum, lot) => sum + Number(lot.valorizado ?? 0), 0)));
    ensureActions('inventario');
    renderRows('inventario', lots.map((lot) => `<tr>
        <td>${esc(lot.codigo_lote)}</td>
        <td>${esc(lot.item)}</td>
        <td>${esc(lot.categoria ?? '—')}</td>
        <td>${esc(lot.unidad ?? '—')}</td>
        <td>${esc(lot.politica_consumo ?? '—')}</td>
        <td>${Number(lot.cantidad_inicial ?? 0).toFixed(2)} ${esc(lot.unidad ?? '')}</td>
        <td>${pill(lot.estado)}</td>
        <td class="table-actions">
            <button type="button" data-edit="lote_inventario" data-id="${lot.id_lote}">Editar lote</button>
        </td>
    </tr>`).join(''));
    wireTableActions('inventario', refreshActive);
}

function renderPurchases() {
    ensureActions('compras');
    renderRows('compras', rowsOf('purchases').map((row) => `<tr>
        <td>#OC-${row.id_orden_compra}</td>
        <td>${esc(row.proveedor)}</td>
        <td>${fmt(row.fecha_emision)}</td>
        <td>${pill(row.estado)}</td>
        <td>${Number(row.recepciones) ? `${row.recepciones} recepción(es)` : 'Pendiente'}</td>
        <td>${money(row.total)}</td>
        <td class="table-actions">
            <button type="button" data-edit="orden_compra" data-id="${row.id_orden_compra}">Editar</button>
        </td>
    </tr>`).join(''));
    wireTableActions('compras', refreshActive);
    addNewButton('compras', 'orden_compra');
}

function renderProduction() {
    ensureActions('produccion');
    renderRows('produccion', rowsOf('production').map((row) => {
        const rendimiento = Number(row.rendimiento) || 1;
        const costoPorcion = Number(row.costo_total) / rendimiento;
        return `<tr>
            <td>${esc(row.receta)}</td>
            <td>${row.rendimiento_real ?? row.rendimiento ?? '—'}</td>
            <td>${money(costoPorcion)}</td>
            <td>${Number(row.merma_estimada ?? 0).toFixed(1)}%</td>
            <td>${fmt(row.fecha_ejecucion)}</td>
            <td>${pill(row.estado)}</td>
            <td class="table-actions">
                <button type="button" data-edit="orden_produccion" data-id="${row.id_orden_produccion}">Editar</button>
            </td>
        </tr>`;
    }).join(''));
    wireTableActions('produccion', refreshActive);
    addNewButton('produccion', 'orden_produccion');
}

function renderRooms() {
    const reservations = rowsOf('reservations');
    const rooms = rowsOf('mesas');
    const s = summary();
    setMetric('sala', 0, String(s.tables ?? rooms.length));
    setMetric('sala', 1, String(reservations.filter((r) => ['pendiente', 'confirmada'].includes(r.estado)).length));
    setMetric('sala', 2, String(reservations.filter((r) => r.estado === 'confirmada').length));

    ensureActions('sala');
    renderRows('sala', reservations.map((r) => `<tr>
        <td>#R-${r.id}</td><td>${esc(r.cliente)}</td><td>${esc(r.mesa)}</td>
        <td>${r.comensales}</td><td>${r.fecha} ${String(r.hora).slice(0, 5)}</td>
        <td>${pill(r.estado)}</td>
        <td class="table-actions">
            <div class="status-editor">
                <select data-status-reservation="${r.id}" data-original="${esc(r.estado)}" aria-label="Cambiar estado de la reserva ${r.id}">
                    ${['pendiente', 'confirmada', 'cancelada', 'cumplida', 'no_asistio']
                        .map((state) => `<option value="${state}" ${state === r.estado ? 'selected' : ''}>${state}</option>`).join('')}
                </select>
                <button type="button" class="btn-gold status-update" data-update-status="${r.id}" hidden>
                    Actualizar estado
                </button>
            </div>
        </td>
    </tr>`).join(''));

    document.querySelectorAll('[data-status-reservation]').forEach((select) => {
        const id = select.dataset.statusReservation;
        const button = document.querySelector(`[data-update-status="${id}"]`);
        select.onchange = () => {
            if (!button) return;
            const changed = select.value !== select.dataset.original;
            button.hidden = !changed;
            button.textContent = changed ? `Actualizar a ${select.value}` : 'Actualizar estado';
        };
        if (button) button.onclick = async () => {
            if (select.value === select.dataset.original) return;
            try {
                await adminApi(`reservations/${id}/estado`, {
                    method: 'PATCH', body: JSON.stringify({ estado: select.value }),
                });
                toast('Estado de la reserva actualizado');
                await refreshActive();
            } catch (error) { toast(error.message); }
        };
    });

    let mesasCard = document.getElementById('adminMesasCard');
    if (!mesasCard) {
        const section = document.querySelector('#sala');
        mesasCard = document.createElement('div');
        mesasCard.id = 'adminMesasCard';
        mesasCard.className = 'table-card';
        mesasCard.style.marginTop = '18px';
        mesasCard.innerHTML = `<div class="card-header-bar">
                <h2><i class="fa-solid fa-chair" aria-hidden="true"></i> Mesas del salón (mesa)</h2>
                <button type="button" class="btn-gold" data-new-table="mesa">
                    <i class="fa-solid fa-plus" aria-hidden="true"></i> Nueva mesa
                </button>
            </div>
            <div class="table-responsive"><table class="admin-table">
                <thead><tr><th>ID</th><th>Número</th><th>Capacidad</th><th>Activa</th><th>Acciones</th></tr></thead>
                <tbody id="adminMesasBody"></tbody>
            </table></div>`;
        section.appendChild(mesasCard);
        mesasCard.addEventListener('click', (event) => {
            const button = event.target.closest('[data-new-table]');
            if (button) openRecordForm(button.dataset.newTable);
        });
    }
    document.getElementById('adminMesasBody').innerHTML = rooms.map((room) => `<tr>
        <td>${room.id_mesa}</td><td>${esc(room.numero)}</td><td>${room.capacidad}</td>
        <td>${pill(room.activa ? 'activo' : 'inactivo')}</td>
        <td class="table-actions">
            <button type="button" data-room-toggle="${room.id_mesa}" data-activa="${room.activa}">${room.activa ? 'Desactivar' : 'Activar'}</button>
            <button type="button" data-edit="mesa" data-id="${room.id_mesa}">Editar</button>
        </td></tr>`).join('') || '<tr><td class="table-empty" colspan="5">No hay mesas registradas.</td></tr>';

    document.querySelectorAll('[data-room-toggle]').forEach((button) => {
        button.onclick = async () => {
            try {
                await adminApi(`tables/${button.dataset.roomToggle}/activa`, {
                    method: 'PATCH', body: JSON.stringify({ activa: button.dataset.activa !== 'true' }),
                });
                toast('Mesa actualizada');
                await refreshActive();
            } catch (error) { toast(error.message); }
        };
    });
    wireTableActions('sala', refreshActive);
}

function renderSales() {
    ensureActions('ventas');
    renderRows('ventas', rowsOf('sales').map((v) => `<tr>
        <td>#V-${v.id_venta}</td>
        <td>#C-${v.id_caja_sesion}</td>
        <td>${esc(v.medios)}</td>
        <td>${money(v.total)}</td>
        <td>${fmt(v.fecha_venta)}</td>
        <td>${pill(v.estado)}</td>
        <td class="table-actions">
            <button type="button" data-edit="venta" data-id="${v.id_venta}">Editar</button>
        </td>
    </tr>`).join(''));
    wireTableActions('ventas', refreshActive);
    addNewButton('ventas', 'venta');
}

function renderAccounting() {
    ensureActions('contabilidad');
    renderRows('contabilidad', rowsOf('finance').map((a) => `<tr>
        <td>#A-${a.id_movimiento_contable}</td>
        <td>${esc(a.tipo)}</td>
        <td>${esc(a.detalle)}</td>
        <td>${Number(a.signo) > 0 ? '+' : '−'}</td>
        <td>${money(a.monto)}</td>
        <td>${fmt(a.fecha)}</td>
        <td class="table-actions">
            <button type="button" data-edit="movimiento_contable" data-id="${a.id_movimiento_contable}">Editar</button>
        </td>
    </tr>`).join(''));
    wireTableActions('contabilidad', refreshActive);
    addNewButton('contabilidad', 'movimiento_contable');
}

function renderUsers() {
    const users = rowsOf('users');
    setMetric('usuarios', 0, String(users.length));
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    tbody.innerHTML = users.map((u) => `<tr>
        <td>${u.id}</td><td>${esc(u.nombre)}</td><td>${esc(u.email)}</td>
        <td>${esc(u.roles || '—')}</td><td>${pill(u.activo ? 'activo' : 'inactivo')}</td>
        <td class="table-actions"><button type="button" data-edit="usuarios" data-id="${u.id}">Editar</button></td>
    </tr>`).join('') || '<tr><td class="table-empty" colspan="6">No hay usuarios registrados.</td></tr>';
    wireTableActions('usuarios', refreshActive);
}

function renderAudit() {
    const a = cache.audit || {};
    const metrics = document.querySelectorAll('#auditoria .metric-value');
    if (metrics[0]) metrics[0].textContent = 'Activo';
    if (metrics[1]) metrics[1].textContent = `${a.tablas ?? '—'} tablas`;
    if (metrics[2]) metrics[2].textContent = `${a.foraneas ?? '—'} FK`;

    const timeline = document.getElementById('auditTimeline');
    if (!timeline) return;
    timeline.innerHTML = `<div class="audit-item">
        <div class="audit-header">
            <div class="audit-user"><i class="fa-solid fa-database" style="color: var(--color-gold);" aria-hidden="true"></i> Verificación del esquema en producción</div>
            <div class="audit-time">${fmt(a.actualizado)}</div>
        </div>
        <div class="audit-action">
            Se consultaron directamente los metadatos de la base de datos de Neon para comprobar la estructura desplegada.
        </div>
        <div class="audit-details">
            Tablas base: ${esc(a.tablas ?? '—')}<br>
            Vistas: ${esc(a.vistas ?? '—')}<br>
            Llaves foráneas: ${esc(a.foraneas ?? '—')}<br>
            Registros estimados: ${esc(a.registros ?? '—')}
        </div>
    </div>`;
}

function renderErModel() {
    const a = cache.audit || {};
    const node = document.getElementById('erModelSummary');
    if (node) node.textContent = `${a.tablas ?? '—'} tablas · ${a.foraneas ?? '—'} foreign keys`;
}

// ---------- Formulario genérico de alta/edición ----------
let modalState = null;
let toastTimer;

function toast(message) {
    const node = document.getElementById('adminToast');
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 3500);
}

function closeModal() {
    document.getElementById('adminModal').hidden = true;
    modalState = null;
}

function fieldHtml(column, value) {
    if (!column.editable) return '';
    const name = column.name;
    const label = name.replace(/_/g, ' ');
    const required = column.nullable === 'NO' && !column.default;
    const type = column.type || '';
    let input;

    if (type.includes('boolean')) {
        const checked = value === true || value === 'true' || value === 't' || Number(value) === 1;
        input = `<input type="checkbox" name="${name}" ${checked ? 'checked' : ''}>`;
    } else if (type === 'date') {
        input = `<input type="date" name="${name}" value="${esc(String(value ?? '').slice(0, 10))}">`;
    } else if (type === 'time' || type.includes('without time zone')) {
        input = `<input type="text" name="${name}" value="${esc(String(value ?? '').slice(0, 19))}" placeholder="HH:MM:SS">`;
    } else if (/integer|numeric|decimal|real|double/.test(type)) {
        input = `<input type="number" step="any" name="${name}" value="${esc(value ?? '')}">`;
    } else if (type === 'text' && /descripcion|observacion|detalle|concepto/.test(name)) {
        input = `<textarea name="${name}" rows="3">${esc(value ?? '')}</textarea>`;
    } else {
        input = `<input type="text" name="${name}" value="${esc(value ?? '')}">`;
    }
    return `<div class="form-field ${type === 'text' ? 'full' : ''}">
        <label for="field-${esc(name)}">${esc(label)}${required ? ' *' : ''}</label>${input.replace('<input', `<input id="field-${esc(name)}"`).replace('<textarea', `<textarea id="field-${esc(name)}"`)}</div>`;
}

async function openRecordForm(table, id = null) {
    try {
        const meta = await adminApi(`data/${table}/schema`);
        const row = id === null ? {} : await adminApi(`data/${table}/${id}`);
        modalState = { mode: 'record', table, id, columns: meta.columns };

        document.getElementById('adminModalTitle').textContent =
            id === null ? `Nuevo registro · ${table}` : `Editar ${table} #${id}`;
        document.getElementById('adminFormFields').innerHTML =
            `<div class="form-grid">${meta.columns.map((c) => fieldHtml(c, row[c.name])).join('')}</div>`;
        document.getElementById('adminFormError').textContent = '';
        document.getElementById('adminModal').hidden = false;
        document.querySelector('#adminForm input, #adminForm select, #adminForm textarea')?.focus();
    } catch (error) { toast(error.message); }
}

function openUserForm() {
    modalState = { mode: 'user' };
    document.getElementById('adminModalTitle').textContent = 'Nuevo usuario';
    document.getElementById('adminFormFields').innerHTML = `<div class="form-grid">
        <div class="form-field"><label for="newUserName">Nombre *</label><input id="newUserName" name="nombre" required></div>
        <div class="form-field"><label for="newUserEmail">Correo *</label><input id="newUserEmail" type="email" name="email" required></div>
        <div class="form-field"><label for="newUserPassword">Contraseña *</label><input id="newUserPassword" type="password" name="password" required minlength="4"></div>
        <div class="form-field"><label for="newUserRole">Rol *</label><select id="newUserRole" name="rol">
            <option value="CLIENTE">CLIENTE</option><option value="ADMINISTRADOR">ADMINISTRADOR</option>
        </select></div>
    </div>`;
    document.getElementById('adminFormError').textContent = '';
    document.getElementById('adminModal').hidden = false;
    document.getElementById('newUserName')?.focus();
}

async function saveModal(event) {
    event.preventDefault();
    if (!modalState) return;
    const form = document.getElementById('adminForm');
    const errorNode = document.getElementById('adminFormError');
    errorNode.textContent = '';

    try {
        if (modalState.mode === 'user') {
            const values = Object.fromEntries(new FormData(form));
            await adminApi('users', { method: 'POST', body: JSON.stringify(values) });
        } else {
            const values = {};
            for (const column of modalState.columns) {
                if (!column.editable) continue;
                const field = form.elements[column.name];
                if (!field) continue;
                if (column.type.includes('boolean')) values[column.name] = field.checked;
                else if (field.value !== '') {
                    values[column.name] = /integer|numeric|decimal|real|double/.test(column.type)
                        ? Number(field.value) : field.value;
                } else if (column.nullable === 'NO' && !column.default) {
                    throw new Error(`El campo ${column.name} es obligatorio`);
                }
            }
            const path = modalState.id === null
                ? `data/${modalState.table}`
                : `data/${modalState.table}/${modalState.id}`;
            await adminApi(path, {
                method: modalState.id === null ? 'POST' : 'PATCH',
                body: JSON.stringify(values),
            });
        }
        closeModal();
        toast('Cambios guardados correctamente');
        await refreshActive();
    } catch (error) {
        errorNode.textContent = error.message;
    }
}

function wireTableActions(section, reload) {
    const container = document.querySelector(`#${section}`);
    if (!container || container.dataset.actionsWired) return;
    container.dataset.actionsWired = 'true';
    container.addEventListener('click', async (event) => {
        const edit = event.target.closest('[data-edit]');
        const remove = event.target.closest('[data-delete]');
        if (edit) return openRecordForm(edit.dataset.edit, edit.dataset.id);
        if (remove) {
            if (!window.confirm('¿Confirmas esta acción?')) return;
            try {
                await adminApi(`data/${remove.dataset.delete}/${remove.dataset.id}`, { method: 'DELETE' });
                toast('Registro eliminado');
                await reload();
            } catch (error) { toast(error.message); }
        }
    });
}

function addNewButton(section, table) {
    const header = document.querySelector(`#${section} .card-header-bar`);
    if (!header || header.querySelector('[data-new-table]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-gold';
    button.dataset.newTable = table;
    button.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i> Nuevo registro';
    button.addEventListener('click', () => openRecordForm(table));
    header.appendChild(button);
}

// ---------- Accesibilidad del panel ----------
function initAccessibility() {
    const root = document.documentElement;
    const saved = JSON.parse(localStorage.getItem(A11Y_KEY) || '{}');
    const large = document.getElementById('a11yLarge');
    const contrast = document.getElementById('a11yContrast');
    const reduced = document.getElementById('a11yReduced');
    const speed = document.getElementById('a11ySpeed');
    const toggle = document.getElementById('a11yToggle');
    const panel = document.getElementById('a11yPanel');
    if (!large || !contrast || !reduced || !speed || !toggle || !panel) return;

    large.checked = Boolean(saved.large);
    contrast.checked = Boolean(saved.contrast);
    reduced.checked = Boolean(saved.reduced);
    speed.value = ['normal', 'lenta', 'sin'].includes(saved.speed) ? saved.speed : 'normal';

    const apply = () => {
        root.classList.toggle('a11y-large', large.checked);
        root.classList.toggle('a11y-contrast', contrast.checked);
        root.classList.toggle('a11y-reduced', reduced.checked);
        root.classList.toggle('a11y-slow', speed.value === 'lenta');
        root.classList.toggle('a11y-none', speed.value === 'sin');
        localStorage.setItem(A11Y_KEY, JSON.stringify({
            large: large.checked, contrast: contrast.checked,
            reduced: reduced.checked, speed: speed.value,
        }));
    };
    [large, contrast, reduced, speed].forEach((control) => control.addEventListener('change', apply));
    apply();

    toggle.addEventListener('click', () => {
        const willOpen = panel.hidden;
        panel.hidden = !willOpen;
        toggle.setAttribute('aria-expanded', String(willOpen));
    });
    document.addEventListener('click', (event) => {
        if (panel.hidden) return;
        if (panel.contains(event.target) || toggle.contains(event.target)) return;
        panel.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
    });
}

function initKeyboardNav() {
    const buttons = [...document.querySelectorAll('.nav-link')];
    buttons.forEach((button, index) => {
        button.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            buttons[(index + 1) % buttons.length].focus();
        });
    });
}

// ---------- Arranque ----------
if (isAdmin) {
    document.getElementById('adminLogout').addEventListener('click', () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/';
    });
    document.getElementById('newUserBtn').addEventListener('click', openUserForm);
    document.getElementById('adminForm').addEventListener('submit', saveModal);
    document.getElementById('adminModalClose').addEventListener('click', closeModal);
    document.getElementById('adminFormCancel').addEventListener('click', closeModal);
    document.getElementById('adminModal').addEventListener('click', (event) => {
        if (event.target.id === 'adminModal') closeModal();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !document.getElementById('adminModal').hidden) closeModal();
    });

    const badge = document.querySelector('.user-info .name');
    if (badge) badge.textContent = currentUser.nombre;
    const role = document.querySelector('.user-info .role');
    if (role) role.textContent = 'Administrador';

    initAccessibility();
    initKeyboardNav();
    const savedTab = sessionStorage.getItem(ACTIVE_TAB_KEY);
    const initialModule = titles[savedTab] ? savedTab : 'dashboard';
    activateModule(initialModule);
    preloadAll().then(() => renderModule(initialModule));
}
