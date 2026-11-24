// Panel administrativo de Domus Fuego.
// La interfaz viene del repositorio domus-admin; aquí se conecta a /api/admin.
// Todos los datos se precargan una sola vez: cambiar de vista solo renderiza
// el cache, sin peticiones ni valores demostrativos que "cambien" de un módulo a otro.
// El menú lateral es desplegable: cada módulo abre sus CRUDs y vistas reales.

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
    'usuarios': 'Módulo: Usuarios & Roles',
    'catalogos': 'Módulo: Catálogos y Tablas'
};

// Las 38 tablas permitidas por ADMIN_TABLES en el backend, con etiqueta legible.
const TABLE_LABELS = Object.freeze({
    caja_sesion: 'Sesiones de caja',
    categoria_gasto: 'Categorías de gasto',
    categoria_item: 'Categorías de ítems',
    cliente: 'Clientes',
    costo_receta: 'Costos de recetas',
    costo_receta_detalle: 'Detalle de costos de receta',
    gasto_operativo: 'Gastos operativos',
    item: 'Productos / Ítems',
    item_presentacion: 'Presentaciones',
    item_proveedor: 'Productos por proveedor',
    lote_inventario: 'Lotes de inventario',
    merma: 'Mermas',
    mesa: 'Mesas',
    movimiento_contable: 'Movimientos contables',
    movimiento_inventario: 'Movimientos de inventario',
    orden_compra: 'Órdenes de compra',
    orden_compra_detalle: 'Detalle de órdenes de compra',
    orden_produccion: 'Órdenes de producción',
    orden_produccion_detalle: 'Detalle de órdenes de producción',
    pago: 'Pagos',
    pedido: 'Pedidos',
    pedido_detalle: 'Detalle de pedidos',
    precio_venta: 'Precios de venta',
    proveedor: 'Proveedores',
    recepcion: 'Recepciones',
    recepcion_detalle: 'Detalle de recepciones',
    receta: 'Recetas',
    receta_detalle: 'Detalle de recetas',
    reserva: 'Reservas',
    reserva_detalle: 'Detalle de reservas',
    roles: 'Roles',
    rolesxusuario: 'Roles por usuario',
    tipo_movimiento: 'Tipos de movimiento',
    tipo_movimiento_contable: 'Tipos de movimiento contable',
    unidad_medida: 'Unidades de medida',
    usuario: 'Usuarios (acceso)',
    usuarios: 'Usuarios (perfil)',
    venta: 'Ventas',
});
const ALL_TABLES = Object.keys(TABLE_LABELS);

// Tablas incluidas en el desplegable de cada módulo.
const moduleTables = Object.freeze({
    inventario: ['categoria_item', 'item', 'item_presentacion', 'precio_venta',
        'unidad_medida', 'proveedor', 'item_proveedor', 'lote_inventario', 'movimiento_inventario'],
    compras: ['proveedor', 'orden_compra', 'orden_compra_detalle', 'recepcion', 'recepcion_detalle'],
    produccion: ['receta', 'receta_detalle', 'costo_receta', 'costo_receta_detalle',
        'orden_produccion', 'orden_produccion_detalle', 'merma', 'tipo_movimiento'],
    sala: ['cliente', 'mesa', 'reserva', 'reserva_detalle'],
    ventas: ['caja_sesion', 'pedido', 'pedido_detalle', 'venta', 'pago'],
    contabilidad: ['categoria_gasto', 'gasto_operativo', 'tipo_movimiento_contable',
        'movimiento_contable', 'tipo_movimiento'],
    usuarios: ['usuario', 'usuarios', 'roles', 'rolesxusuario', 'cliente'],
});
const tablesFor = (module) => (moduleTables[module] || [])
    .map((table) => ({ label: TABLE_LABELS[table] || table, table }));

// Relaciones maestro → detalle: habilitan el botón "Ver detalle" en cada fila.
const DETAIL_MAP = Object.freeze({
    orden_compra: { table: 'orden_compra_detalle', fk: 'id_orden_compra' },
    orden_compra_detalle: { table: 'recepcion_detalle', fk: 'id_oc_detalle' },
    recepcion: { table: 'recepcion_detalle', fk: 'id_recepcion' },
    pedido: { table: 'pedido_detalle', fk: 'id_pedido' },
    reserva: { table: 'reserva_detalle', fk: 'id_reserva' },
    receta: { table: 'receta_detalle', fk: 'id_receta' },
    costo_receta: { table: 'costo_receta_detalle', fk: 'id_costo_receta' },
    orden_produccion: { table: 'orden_produccion_detalle', fk: 'id_orden_produccion' },
});

// Configuración del menú: cada módulo es un desplegable con vistas + tablas.
const NAV_GROUPS = [
    {
        id: 'navModulesHeading', heading: 'Módulos Administrativos', modules: [
            { key: 'dashboard', label: 'Resumen Ejecutivo', icon: 'fa-chart-line', children: [
                { label: 'Indicadores y últimos movimientos', view: 'dashboard' },
            ] },
            { key: 'inventario', label: 'Catálogo e Items', icon: 'fa-boxes-stacked', children: [
                { label: 'Resumen de inventario', view: 'inventario' },
                { label: 'Unidades por producto (vista)', view: 'itemUnits' },
                ...tablesFor('inventario'),
            ] },
            { key: 'compras', label: 'Compras & Proveedores', icon: 'fa-truck-ramp-box', children: [
                { label: 'Resumen de compras', view: 'compras' },
                ...tablesFor('compras'),
            ] },
            { key: 'produccion', label: 'Producción & Recetas', icon: 'fa-kitchen-set', children: [
                { label: 'Resumen de producción', view: 'produccion' },
                ...tablesFor('produccion'),
            ] },
            { key: 'sala', label: 'Mesas & Reservas', icon: 'fa-chair', children: [
                { label: 'Resumen de reservas y mesas', view: 'sala' },
                ...tablesFor('sala'),
            ] },
            { key: 'ventas', label: 'Pedidos, Ventas & Caja', icon: 'fa-cash-register', children: [
                { label: 'Resumen de ventas', view: 'ventas' },
                ...tablesFor('ventas'),
            ] },
            { key: 'contabilidad', label: 'Finanzas & Gastos', icon: 'fa-scale-balanced', children: [
                { label: 'Resumen financiero', view: 'contabilidad' },
                ...tablesFor('contabilidad'),
            ] },
            { key: 'er_model', label: 'Modelo Entidad-Relación', icon: 'fa-project-diagram', children: [
                { label: 'Diagrama del esquema', view: 'er_model' },
            ] },
            { key: 'usuarios', label: 'Usuarios & Roles', icon: 'fa-users-gear', children: [
                { label: 'Resumen de usuarios', view: 'usuarios' },
                ...tablesFor('usuarios'),
            ] },
            { key: 'catalogos', label: 'Catálogos y Tablas', icon: 'fa-database', children: [
                { label: 'Vista general de todas las tablas', view: 'catalogos' },
                ...ALL_TABLES.map((table) => ({ label: TABLE_LABELS[table], table })),
            ] },
        ],
    },
    {
        id: 'navSecurityHeading', heading: 'Seguridad & Control', modules: [
            { key: 'auditoria', label: 'Auditoría & Bitácora', icon: 'fa-shield-halved', audit: true, children: [
                { label: 'Verificación del esquema', view: 'auditoria' },
                { label: 'Bitácora de eventos', view: 'logs' },
            ] },
        ],
    },
];

const VIEW_REGISTRY = Object.create(null);
const ACTIVE_VIEW_KEY = 'domusfuego-admin-active-view';
let currentView = null;
let currentDetail = null;

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

function setDropdown(button, open) {
    if (!button) return;
    button.setAttribute('aria-expanded', String(open));
    button.classList.toggle('open', open);
    const submenu = document.getElementById(button.getAttribute('aria-controls'));
    if (submenu) submenu.hidden = !open;
}

function expandModule(moduleKey) {
    setDropdown(document.querySelector(`.nav-dropdown-toggle[data-module="${moduleKey}"]`), true);
}

function renderSidebar() {
    const host = document.getElementById('sidebarNav');
    if (!host) return;
    host.innerHTML = NAV_GROUPS.map((group) => `
        <div class="nav-section-title" id="${esc(group.id)}">${esc(group.heading)}</div>
        <ul class="nav-menu" aria-labelledby="${esc(group.id)}">
            ${group.modules.map((mod) => `
                <li class="nav-item nav-dropdown">
                    <button type="button" class="nav-link nav-dropdown-toggle${mod.audit ? ' audit-special' : ''}"
                            data-module="${esc(mod.key)}" aria-expanded="false" aria-controls="submenu-${esc(mod.key)}">
                        <i class="fa-solid ${esc(mod.icon)}" aria-hidden="true"></i>
                        <span>${esc(mod.label)}</span>
                        <i class="fa-solid fa-chevron-down nav-chevron" aria-hidden="true"></i>
                    </button>
                    <ul class="nav-submenu" id="submenu-${esc(mod.key)}" hidden>
                        ${mod.children.map((child) => {
                            const key = child.table
                                ? `table:${mod.key}:${child.table}`
                                : `view:${child.view || mod.key}`;
                            VIEW_REGISTRY[key] = { ...child, module: mod.key, key };
                            return `<li><button type="button" class="nav-sublink" data-view-key="${esc(key)}">
                                <i class="fa-solid ${child.table ? 'fa-table' : 'fa-angle-right'}" aria-hidden="true"></i>
                                <span>${esc(child.label)}</span></button></li>`;
                        }).join('')}
                    </ul>
                </li>`).join('')}
        </ul>`).join('');

    host.querySelectorAll('.nav-dropdown-toggle').forEach((button) => {
        button.addEventListener('click', () => {
            setDropdown(button, button.getAttribute('aria-expanded') !== 'true');
        });
    });
    host.querySelectorAll('[data-view-key]').forEach((button) => {
        button.addEventListener('click', () => openView(button.dataset.viewKey));
    });
}

function activateSection(sectionKey) {
    document.querySelectorAll('.module-view').forEach((el) => {
        el.classList.toggle('active', el.id === sectionKey);
    });
}

function openView(key, options = {}) {
    const item = VIEW_REGISTRY[key];
    if (!item) return;
    currentView = item;
    sessionStorage.setItem(ACTIVE_VIEW_KEY, key);

    document.querySelectorAll('.nav-sublink').forEach((button) => {
        button.classList.toggle('active', button.dataset.viewKey === key);
    });
    document.querySelectorAll('.nav-dropdown-toggle').forEach((button) => {
        button.classList.toggle('active', button.dataset.module === item.module);
    });
    expandModule(item.module);

    const breadcrumb = document.getElementById('moduleBreadcrumb');
    if (breadcrumb) {
        breadcrumb.textContent = item.table
            ? `${titles[item.module] || ''} · ${TABLE_LABELS[item.table] || item.table}`
            : (item.label.startsWith('Indicadores') ? titles[item.view] : item.label);
    }

    if (!options.keepDetail) {
        currentDetail = null;
        const detailHost = document.getElementById('tableExplorerDetail');
        if (detailHost) detailHost.innerHTML = '';
    }

    if (item.table) {
        renderTableExplorer(item.table);
    } else if (item.view === 'itemUnits') {
        renderUnitsExplorer();
    } else {
        activateSection(item.view);
        loadModule(item.view);
    }
    if (window.innerWidth <= 992) toggleSidebar(false);
}

// ---------- Sesión y acceso a la API ----------
const TOKEN_KEY = 'domusfuego-token';
const USER_KEY = 'domusfuego-user';
const A11Y_KEY = 'domusfuego-admin-a11y';
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
        'cerrada', 'cerrado', 'aprobado', 'disponible', 'ok'].includes(value);
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

const cellText = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object') return JSON.stringify(value).slice(0, 80);
    return String(value).slice(0, 90);
};

// ---------- Catálogos / CRUDs independientes por módulo ----------
function catalogPkOf(table, rows) {
    const known = rowsOf('tables').find((item) => item.table === table);
    return known?.pk || Object.keys(rows[0] || {})[0] || 'id';
}

function renderCatalogCard(container, table) {
    const rows = rowsOf(`cat:${table}`);
    let card = document.getElementById(`catalog-${table}`);
    if (!card) {
        card = document.createElement('div');
        card.id = `catalog-${table}`;
        card.className = 'table-card catalog-card';
        card.style.marginTop = '18px';
        container.appendChild(card);
    }
    const pk = catalogPkOf(table, rows);
    const columns = rows.length
        ? Object.keys(rows[0]).filter((name) => name !== 'password_hash').slice(0, 7)
        : [pk];
    card.innerHTML = `<div class="card-header-bar">
            <h2><i class="fa-solid fa-table" aria-hidden="true"></i> ${esc(table)}
                <span class="catalog-count">${rows.length} registro(s)</span></h2>
            <button type="button" class="btn-gold" data-new-table="${esc(table)}">
                <i class="fa-solid fa-plus" aria-hidden="true"></i> Nuevo
            </button>
        </div>
        <div class="table-responsive"><table class="admin-table">
            <thead><tr>${columns.map((name) => `<th scope="col">${esc(name)}</th>`).join('')}
                <th scope="col">Acciones</th></tr></thead>
            <tbody>${rows.map((row) => `<tr>
                ${columns.map((name) => `<td>${esc(cellText(row[name]))}</td>`).join('')}
                <td class="table-actions">
                    <button type="button" data-edit="${esc(table)}" data-id="${esc(row[pk])}">Editar</button>
                    <button type="button" data-delete="${esc(table)}" data-id="${esc(row[pk])}">Eliminar</button>
                </td></tr>`).join('') || `<tr><td class="table-empty" colspan="${columns.length + 1}">Sin registros en ${esc(table)}.</td></tr>`}
            </tbody>
        </table></div>`;
}

function renderAllCatalogs() {
    let zone = document.getElementById('catalog-zone-catalogos');
    if (!zone) {
        const section = document.getElementById('catalogos');
        zone = document.createElement('div');
        zone.id = 'catalog-zone-catalogos';
        section?.appendChild(zone);
    }
    const tables = rowsOf('tables')
        .map((item) => item.table)
        .filter((table) => table !== 'auditoria_log');
    tables.forEach((table) => renderCatalogCard(zone, table));
    wireTableActions('catalogos', refreshActive);
    const filter = document.getElementById('catalogFilter');
    if (filter && !filter.dataset.wired) {
        filter.dataset.wired = 'true';
        filter.addEventListener('input', () => {
            const q = filter.value.trim().toLowerCase();
            zone.querySelectorAll('.catalog-card').forEach((card) => {
                card.hidden = !card.id.replace('catalog-', '').toLowerCase().includes(q);
            });
        });
    }
}

function unitsRowsHtml() {
    return rowsOf('itemUnits').map((u) => `<tr>
        <td>${esc(u.producto)}</td>
        <td>${esc(u.simbolo_base ?? u.unidad_base)}</td>
        <td>${esc(u.simbolo_compra ?? u.unidad_compra ?? '—')}</td>
        <td>${u.factor_compra ?? '—'}</td>
        <td>${esc(u.simbolo_venta ?? u.unidad_venta ?? '—')}</td>
        <td>${u.factor_venta ?? '—'}</td>
        <td>${pill(u.estado)}</td>
        <td class="table-actions"><button type="button" data-edit="item" data-id="${u.id_item}">Editar producto</button></td>
    </tr>`).join('') || '<tr><td class="table-empty" colspan="8">No hay unidades configuradas.</td></tr>';
}

function unitsTableHtml() {
    return `<div class="table-responsive"><table class="admin-table">
        <thead><tr><th>Producto</th><th>Base</th><th>Compra</th><th>Factor compra</th>
            <th>Venta</th><th>Factor venta</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${unitsRowsHtml()}</tbody>
    </table></div>`;
}

function renderItemUnitsCard() {
    let card = document.getElementById('adminItemUnitsCard');
    if (!card) {
        card = document.createElement('div');
        card.id = 'adminItemUnitsCard';
        card.className = 'table-card';
        card.style.marginTop = '18px';
        card.innerHTML = `<div class="card-header-bar">
                <h2><i class="fa-solid fa-ruler-combined" aria-hidden="true"></i>
                    Unidades de medida por producto (con conversión automática)</h2>
                <span class="catalog-count">factor = unidad ÷ unidad base · se calcula en la BD</span>
            </div>${unitsTableHtml()}`;
        document.getElementById('inventario')?.appendChild(card);
    }
    const body = card.querySelector('tbody');
    if (body) body.innerHTML = unitsRowsHtml();
}

// ---------- Explorador genérico: una tabla o vista por opción del menú ----------
function tableRowsHtml(table, rows, pk) {
    const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter((k) => k !== 'password_hash');
    const columns = keys.length ? keys : [pk];
    const detail = DETAIL_MAP[table];
    return `<div class="table-responsive"><table class="admin-table">
        <thead><tr>${columns.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}
            <th scope="col">Acciones</th></tr></thead>
        <tbody>${rows.map((row) => `<tr>
            ${columns.map((c) => `<td>${esc(cellText(row[c]))}</td>`).join('')}
            <td class="table-actions">
                <button type="button" data-edit="${esc(table)}" data-id="${esc(row[pk])}">Editar</button>
                ${detail ? `<button type="button" data-detail="${esc(table)}" data-detail-id="${esc(row[pk])}"
                    data-detail-fk="${esc(detail.fk)}"><i class="fa-solid fa-list-check" aria-hidden="true"></i> Ver detalle</button>` : ''}
                <button type="button" class="danger" data-delete="${esc(table)}" data-id="${esc(row[pk])}">Eliminar</button>
            </td></tr>`).join('') || `<tr><td class="table-empty" colspan="${columns.length + 1}">Sin registros en ${esc(TABLE_LABELS[table] || table)}.</td></tr>`}
        </tbody></table></div>`;
}

function setExplorerHeader(title, note, newTable) {
    const titleNode = document.getElementById('tableExplorerTitle');
    if (titleNode) titleNode.innerHTML = title;
    const noteNode = document.getElementById('tableExplorerNote');
    if (noteNode) noteNode.textContent = note || '';
    const newBtn = document.getElementById('tableExplorerNew');
    if (newBtn) {
        newBtn.hidden = !newTable;
        if (newTable) newBtn.dataset.newTable = newTable;
        else delete newBtn.dataset.newTable;
    }
}

function renderTableExplorer(table) {
    const rows = rowsOf(`cat:${table}`);
    const pk = catalogPkOf(table, rows);
    setExplorerHeader(
        `<i class="fa-solid fa-table" aria-hidden="true"></i> ${esc(TABLE_LABELS[table] || table)}
         <span class="catalog-count">${rows.length} registro(s)</span>`,
        `CRUD de ${table}. Los campos de relación (proveedor, producto, unidad, usuario, rol…) se eligen en comboboxes con datos reales.`,
        table
    );
    const host = document.getElementById('tableExplorerTable');
    if (host) host.innerHTML = tableRowsHtml(table, rows, pk);
    wireTableActions('tableExplorer', refreshActive);
    activateSection('tableExplorer');
}

function renderUnitsExplorer() {
    setExplorerHeader(
        '<i class="fa-solid fa-ruler-combined" aria-hidden="true"></i> Unidades de medida por producto',
        'factor = factor_base(unidad) ÷ factor_base(unidad base). Calculado por la base de datos; edítalo desde Productos / Ítems.',
        null
    );
    const host = document.getElementById('tableExplorerTable');
    if (host) host.innerHTML = unitsTableHtml();
    wireTableActions('tableExplorer', refreshActive);
    activateSection('tableExplorer');
}

function showDetail(masterTable, fk, id) {
    const detail = DETAIL_MAP[masterTable];
    const host = document.getElementById('tableExplorerDetail');
    if (!detail || !host) return;
    currentDetail = { masterTable, fk, id };
    const rows = rowsOf(`cat:${detail.table}`).filter((row) => String(row[fk]) === String(id));
    const pk = catalogPkOf(detail.table, rows);
    host.innerHTML = `<div class="table-card catalog-card" style="margin-top:18px">
        <div class="card-header-bar">
            <h2><i class="fa-solid fa-list-check" aria-hidden="true"></i> ${esc(TABLE_LABELS[detail.table] || detail.table)}
                <span class="catalog-count">${esc(TABLE_LABELS[masterTable] || masterTable)} #${esc(id)} · ${rows.length} fila(s)</span></h2>
            <div class="explorer-actions">
                <button type="button" class="btn-gold" data-new-table="${esc(detail.table)}"
                        data-prefill-fk="${esc(fk)}" data-prefill-id="${esc(id)}">
                    <i class="fa-solid fa-plus" aria-hidden="true"></i> Nueva línea
                </button>
                <button type="button" class="btn-red" id="detailClose">Cerrar detalle</button>
            </div>
        </div>
        ${tableRowsHtml(detail.table, rows, pk)}
    </div>`;
    host.querySelector('#detailClose')?.addEventListener('click', () => {
        host.innerHTML = '';
        currentDetail = null;
    });
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
    logs: 'logs',
    mesas: 'data/mesa',
    tables: 'data',
    itemUnits: 'item-unidades',
    // Las 38 tablas se precargan completas (hasta 500 filas) para que el
    // explorador y el "Ver detalle" funcionen sin peticiones adicionales.
    ...Object.fromEntries(ALL_TABLES.map((table) => [`cat:${table}`, `data/${table}?limit=500`])),
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
        catalogos: renderAllCatalogs,
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
    const detail = currentDetail;
    currentDetail = null;
    if (currentView) openView(currentView.key, { keepDetail: true });
    else renderModule(document.querySelector('.module-view.active')?.id || 'dashboard');
    if (detail) showDetail(detail.masterTable, detail.fk, detail.id);
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
    renderItemUnitsCard();
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
    if (timeline) {
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

    const logs = rowsOf('logs');
    const logsBody = document.getElementById('auditLogsBody');
    if (logsBody) {
        logsBody.innerHTML = logs.map((log) => `<tr>
            <td>${fmt(log.fecha)}</td>
            <td>${esc(log.usuario)}</td>
            <td>${esc(log.modulo)}</td>
            <td>${esc(log.accion)}</td>
            <td>${esc(log.detalle ?? '—')}</td>
            <td>${esc(log.ip ?? '—')}</td>
        </tr>`).join('') || '<tr><td class="table-empty" colspan="6">Aún no hay acciones registradas en la bitácora.</td></tr>';
    }
    const count = document.getElementById('auditLogCount');
    if (count) count.textContent = `${logs.length} evento(s)`;
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
    const name = column.name;
    const label = name.replace(/_/g, ' ');
    const required = column.nullable === 'NO' && !column.default;
    const type = column.type || '';
    let input;
    let full = type === 'text';

    if (column.computed) {
        return `<div class="form-field full">
            <label for="field-${esc(name)}">${esc(label)} <small>(calculado)</small></label>
            <input type="text" id="field-${esc(name)}" value="${esc(value ?? 'Se calculará al guardar')}" disabled>
            <small class="form-hint">Lo calcula la base de datos a partir de la unidad de medida.</small>
        </div>`;
    }
    if (!column.editable) return '';

    if (column.reference) {
        const ref = column.reference;
        const selected = value === null || value === undefined ? '' : String(value);
        const options = [`<option value="">— Seleccionar ${esc(ref.table)} —</option>`]
            .concat(ref.options.map((option) =>
                `<option value="${esc(option.value)}" ${String(option.value) === selected ? 'selected' : ''}>${esc(option.label)}</option>`));
        input = `<select id="field-${esc(name)}" name="${name}" data-fk="${esc(ref.table)}" ${required ? 'required' : ''}>${options.join('')}</select>`;
        full = true;
    } else if (type.includes('boolean')) {
        const checked = value === true || value === 'true' || value === 't' || Number(value) === 1;
        input = `<input type="checkbox" id="field-${esc(name)}" name="${name}" ${checked ? 'checked' : ''}>`;
    } else if (type === 'date') {
        input = `<input type="date" id="field-${esc(name)}" name="${name}" value="${esc(String(value ?? '').slice(0, 10))}">`;
    } else if (type === 'time' || type.includes('without time zone')) {
        input = `<input type="text" id="field-${esc(name)}" name="${name}" value="${esc(String(value ?? '').slice(0, 19))}" placeholder="HH:MM:SS">`;
    } else if (/integer|numeric|decimal|real|double/.test(type)) {
        input = `<input type="number" step="any" id="field-${esc(name)}" name="${name}" value="${esc(value ?? '')}">`;
    } else if (type === 'text' && /descripcion|observacion|detalle|concepto/.test(name)) {
        input = `<textarea id="field-${esc(name)}" name="${name}" rows="3">${esc(value ?? '')}</textarea>`;
    } else {
        input = `<input type="text" id="field-${esc(name)}" name="${name}" value="${esc(value ?? '')}">`;
    }
    return `<div class="form-field ${full ? 'full' : ''}">
        <label for="field-${esc(name)}">${esc(label)}${required ? ' *' : ''}</label>${input}</div>`;
}

async function openRecordForm(table, id = null, prefill = null) {
    try {
        const meta = await adminApi(`data/${table}/schema`);
        const row = id === null ? {} : await adminApi(`data/${table}/${id}`);
        modalState = { mode: 'record', table, id, columns: meta.columns };

        document.getElementById('adminModalTitle').textContent =
            id === null ? `Nuevo registro · ${TABLE_LABELS[table] || table}` : `Editar ${table} #${id}`;
        document.getElementById('adminFormFields').innerHTML =
            `<div class="form-grid">${meta.columns.map((c) =>
                fieldHtml(c, row[c.name] ?? prefill?.[c.name])).join('')}</div>`;
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
                if (!column.editable || column.computed) continue;
                const field = form.elements[column.name];
                if (!field) continue;
                if (column.type.includes('boolean')) values[column.name] = field.checked;
                else if (field.value !== '') {
                    values[column.name] = column.reference
                        || /integer|numeric|decimal|real|double/.test(column.type)
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
    const buttons = [...document.querySelectorAll('.nav-dropdown-toggle, .nav-sublink')];
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
    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-new-table]');
        if (button) {
            const prefill = button.dataset.prefillFk
                ? { [button.dataset.prefillFk]: Number(button.dataset.prefillId) }
                : null;
            openRecordForm(button.dataset.newTable, null, prefill);
            return;
        }
        const detailButton = event.target.closest('[data-detail]');
        if (detailButton) {
            showDetail(detailButton.dataset.detail, detailButton.dataset.detailFk, detailButton.dataset.detailId);
        }
    });
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
    renderSidebar();
    initKeyboardNav();
    const savedView = sessionStorage.getItem(ACTIVE_VIEW_KEY);
    const initialView = VIEW_REGISTRY[savedView] ? savedView : 'view:dashboard';
    openView(initialView);
    preloadAll().then(() => openView(currentView?.key || initialView));
}
