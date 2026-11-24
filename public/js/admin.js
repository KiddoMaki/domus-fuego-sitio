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
    'cargues': 'Módulo: Cargues de Inventario',
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
// Las tablas de detalle NO son opciones del menú: se consultan desde la
// cabecera (OC → líneas, reserva → productos, receta → ingredientes, etc.).
const DETAIL_TABLES = Object.freeze([
    'orden_compra_detalle', 'recepcion_detalle', 'pedido_detalle',
    'reserva_detalle', 'receta_detalle', 'costo_receta_detalle',
    'orden_produccion_detalle',
]);
// Catálogos y Tablas muestra únicamente las tablas necesarias para la interfaz.
const INTERFACE_TABLES = ALL_TABLES.filter((table) => !DETAIL_TABLES.includes(table));

// Tablas independientes incluidas en el desplegable de cada módulo. Las tablas
// de detalle ya NO aparecen como opción suelta: se consultan desde la cabecera.
const moduleTables = Object.freeze({
    inventario: ['categoria_item', 'item', 'item_presentacion', 'precio_venta',
        'unidad_medida', 'proveedor', 'item_proveedor'],
    compras: ['proveedor', 'orden_compra', 'recepcion'],
    produccion: ['receta', 'orden_produccion', 'costo_receta', 'merma', 'tipo_movimiento'],
    cargues: ['lote_inventario', 'movimiento_inventario', 'tipo_movimiento', 'unidad_medida'],
    sala: ['cliente', 'mesa', 'reserva'],
    ventas: ['caja_sesion', 'pedido', 'venta', 'pago'],
    contabilidad: ['categoria_gasto', 'gasto_operativo', 'tipo_movimiento_contable',
        'movimiento_contable', 'tipo_movimiento'],
    usuarios: ['usuario', 'usuarios', 'roles', 'rolesxusuario', 'cliente'],
});
const tablesFor = (module) => (moduleTables[module] || [])
    .map((table) => ({ label: TABLE_LABELS[table] || table, table }));

// Solo se usa en el explorador genérico de Catálogos y Tablas. En los módulos,
// las cabeceras usan MASTER_VIEWS y muestran el detalle desde la propia fila.
const DETAIL_MAP = Object.freeze({
    item: { table: 'movimiento_inventario', fk: 'id_item', custom: 'product' },
    orden_compra: { table: 'orden_compra_detalle', fk: 'id_orden_compra' },
    recepcion: { table: 'recepcion_detalle', fk: 'id_recepcion' },
    pedido: { table: 'pedido_detalle', fk: 'id_pedido' },
    reserva: { table: 'reserva_detalle', fk: 'id_reserva' },
    receta: { table: 'receta_detalle', fk: 'id_receta' },
    costo_receta: { table: 'costo_receta_detalle', fk: 'id_costo_receta' },
    orden_produccion: { table: 'orden_produccion_detalle', fk: 'id_orden_produccion' },
});

// Vistas cabecera-detalle: la cabecera se muestra con datos legibles (nombres,
// fechas, totales) y cada fila abre sus líneas y documentos relacionados.
const MASTER_VIEWS = Object.freeze({
    reserva: {
        title: 'Reservas', icon: 'fa-calendar-check', newTable: 'reserva',
        note: 'Cabecera de reservas: cliente, mesa, fecha y estado. "Ver detalle" abre los productos reservados.',
        columns: [
            ['Cliente', (r) => labelFor('cliente', r.id_cliente)],
            ['Mesa', (r) => labelFor('mesa', r.id_mesa)],
            ['Fecha', (r) => fmtDate(r.fecha)],
            ['Hora', (r) => fmtTime(r.hora)],
            ['Comensales', (r) => num(r.cantidad_comensales)],
            ['Estado', (r) => pill(r.estado)],
            ['Productos', (r) => `${filtered('reserva_detalle', 'id_reserva', r.id_reserva).length} línea(s)`],
            ['Observaciones', (r) => cellText(r.observaciones)],
        ],
        detail: [{ title: 'Productos reservados', table: 'reserva_detalle', fk: 'id_reserva', columns: [
            ['Producto', (d) => labelFor('item', d.id_item)],
            ['Cantidad', (d) => num(d.cantidad)],
            ['Unidad', (d) => unitOfItem(d.id_item)],
            ['Observaciones', (d) => cellText(d.observaciones)],
        ] }],
    },
    orden_compra: {
        title: 'Órdenes de compra', icon: 'fa-file-invoice', newTable: 'orden_compra',
        note: 'Cabecera de compras: proveedor, emisión, estado y total. El detalle muestra las líneas y las recepciones de esa orden.',
        columns: [
            ['Proveedor', (r) => labelFor('proveedor', r.id_proveedor)],
            ['Emisión', (r) => fmtDate(r.fecha_emision)],
            ['Estado', (r) => pill(r.estado)],
            ['Líneas', (r) => `${filtered('orden_compra_detalle', 'id_orden_compra', r.id_orden_compra).length} producto(s)`],
            ['Total', (r) => money(sumLines('orden_compra_detalle', 'id_orden_compra', r.id_orden_compra,
                (d) => Number(d.cantidad_solicitada) * Number(d.precio_pactado)))],
            ['Recepciones', (r) => `${filtered('recepcion', 'id_orden_compra', r.id_orden_compra).length} registro(s)`],
            ['Observaciones', (r) => cellText(r.observaciones)],
        ],
        detail: [
            { title: 'Líneas de la orden', table: 'orden_compra_detalle', fk: 'id_orden_compra', columns: [
                ['Producto', (d) => labelFor('item', d.id_item)],
                ['Cantidad', (d) => num(d.cantidad_solicitada)],
                ['Unidad', (d) => labelFor('unidad_medida', d.id_unidad)],
                ['Precio pactado', (d) => money(d.precio_pactado)],
                ['Subtotal', (d) => money(Number(d.cantidad_solicitada) * Number(d.precio_pactado))],
                ['Recibido', (d) => num(sumLines('recepcion_detalle', 'id_oc_detalle', d.id_oc_detalle,
                    (x) => x.cantidad_recibida))],
            ] },
            { title: 'Recepciones de la orden', table: 'recepcion', fk: 'id_orden_compra', columns: [
                ['Fecha', (r) => fmtDate(r.fecha_recepcion)],
                ['Estado', (r) => pill(r.estado)],
                ['Líneas', (r) => `${filtered('recepcion_detalle', 'id_recepcion', r.id_recepcion).length} producto(s)`],
                ['Observaciones', (r) => cellText(r.observaciones)],
            ] },
        ],
    },
    recepcion: {
        title: 'Recepciones', icon: 'fa-truck-arrow-right', newTable: 'recepcion',
        note: 'Cabecera de recepciones de almacén. El detalle muestra lo recibido por línea y el lote generado.',
        columns: [
            ['Orden de compra', (r) => labelFor('orden_compra', r.id_orden_compra)],
            ['Fecha', (r) => fmtDate(r.fecha_recepcion)],
            ['Estado', (r) => pill(r.estado)],
            ['Productos', (r) => `${filtered('recepcion_detalle', 'id_recepcion', r.id_recepcion).length} línea(s)`],
            ['Observaciones', (r) => cellText(r.observaciones)],
        ],
        detail: [{ title: 'Productos recibidos', table: 'recepcion_detalle', fk: 'id_recepcion', columns: [
            ['Producto', (d) => labelFor('item', findRow('orden_compra_detalle', d.id_oc_detalle)?.id_item)],
            ['Cantidad recibida', (d) => num(d.cantidad_recibida)],
            ['Unidad', (d) => labelFor('unidad_medida', d.id_unidad)],
            ['Costo unitario', (d) => money(d.costo_real_unitario)],
            ['Subtotal', (d) => money(Number(d.cantidad_recibida) * Number(d.costo_real_unitario))],
            ['Lote', (d) => cellText(findRow('lote_inventario_by_recepcion', d.id_recepcion_detalle)?.codigo_lote)],
        ] }],
    },
    pedido: {
        title: 'Pedidos', icon: 'fa-bell-concierge', newTable: 'pedido',
        note: 'Cabecera de pedidos de salón. El detalle abre los productos pedidos y su venta/pagos.',
        columns: [
            ['Reserva', (r) => labelFor('reserva', r.id_reserva)],
            ['Fecha y hora', (r) => `${fmtDate(r.fecha_hora)} ${fmtTime(r.fecha_hora)}`],
            ['Estado', (r) => pill(r.estado)],
            ['Productos', (r) => `${filtered('pedido_detalle', 'id_pedido', r.id_pedido).length} línea(s)`],
            ['Total', (r) => money(sumLines('pedido_detalle', 'id_pedido', r.id_pedido,
                (d) => Number(d.cantidad) * Number(d.precio_unitario)))],
            ['Observaciones', (r) => cellText(r.observaciones)],
        ],
        detail: [
            { title: 'Productos del pedido', table: 'pedido_detalle', fk: 'id_pedido', columns: [
                ['Presentación', (d) => labelFor('item_presentacion', d.id_presentacion)],
                ['Cantidad', (d) => num(d.cantidad)],
                ['Precio unitario', (d) => money(d.precio_unitario)],
                ['Subtotal', (d) => money(Number(d.cantidad) * Number(d.precio_unitario))],
                ['Origen', (d) => cellText(d.origen)],
            ] },
            { title: 'Ventas y pagos', custom: 'orderPayments', fk: 'id_pedido' },
        ],
    },
    receta: {
        title: 'Recetas', icon: 'fa-book-open', customNew: 'recipe',
        note: 'Cabecera de recetas. "Nueva receta" abre un formulario con comboboxes y permite agregar ingredientes (líneas).',
        columns: [
            ['Receta', (r) => cellText(r.nombre)],
            ['Producto resultante', (r) => labelFor('item', r.id_item_resultante)],
            ['Tipo', (r) => cellText(r.tipo)],
            ['Rendimiento', (r) => num(r.rendimiento)],
            ['Unidad', (r) => labelFor('unidad_medida', r.id_unidad_rendimiento)],
            ['Ingredientes', (r) => `${filtered('receta_detalle', 'id_receta', r.id_receta).length} insumo(s)`],
            ['Estado', (r) => pill(r.activa ? 'activo' : 'inactivo')],
        ],
        detail: [
            { title: 'Ingredientes', table: 'receta_detalle', fk: 'id_receta', columns: [
                ['Insumo', (d) => labelFor('item', d.id_item_insumo)],
                ['Cantidad', (d) => num(d.cantidad)],
                ['Unidad', (d) => labelFor('unidad_medida', d.id_unidad)],
                ['Merma esperada', (d) => `${num(d.merma_esperada_pct)} %`],
            ] },
            { title: 'Costos calculados', table: 'costo_receta', fk: 'id_receta', columns: [
                ['Fecha de cálculo', (r) => fmtDate(r.fecha_calculo)],
                ['Rendimiento', (r) => num(r.rendimiento)],
                ['Costo total', (r) => money(sumLines('costo_receta_detalle', 'id_costo_receta', r.id_costo_receta,
                    (d) => Number(d.cantidad) * Number(d.costo_unitario)))],
                ['Costo por porción', (r) => money(sumLines('costo_receta_detalle', 'id_costo_receta', r.id_costo_receta,
                    (d) => Number(d.cantidad) * Number(d.costo_unitario)) / (Number(r.rendimiento) || 1))],
            ] },
            { title: 'Órdenes de producción', table: 'orden_produccion', fk: 'id_receta', columns: [
                ['Tipo', (r) => cellText(r.tipo)],
                ['Estado', (r) => pill(r.estado)],
                ['Planificada', (r) => fmtDate(r.fecha_planificada)],
                ['Ejecutada', (r) => fmtDate(r.fecha_ejecucion)],
                ['Rendimiento real', (r) => num(r.rendimiento_real)],
            ] },
        ],
    },
    orden_produccion: {
        title: 'Órdenes de producción', icon: 'fa-kitchen-set', newTable: 'orden_produccion',
        note: 'Cabecera de producción. El detalle muestra insumos, lotes generados y mermas de esa orden.',
        columns: [
            ['Receta', (r) => labelFor('receta', r.id_receta)],
            ['Tipo', (r) => cellText(r.tipo)],
            ['Estado', (r) => pill(r.estado)],
            ['Planificada', (r) => fmtDate(r.fecha_planificada)],
            ['Ejecutada', (r) => fmtDate(r.fecha_ejecucion)],
            ['Rendimiento real', (r) => num(r.rendimiento_real)],
            ['Observaciones', (r) => cellText(r.observaciones)],
        ],
        detail: [
            { title: 'Insumos de la orden', table: 'orden_produccion_detalle', fk: 'id_orden_produccion', columns: [
                ['Insumo', (d) => labelFor('item', d.id_item_insumo)],
                ['Cantidad teórica', (d) => num(d.cantidad_teorica)],
                ['Cantidad real', (d) => num(d.cantidad_real)],
                ['Unidad', (d) => labelFor('unidad_medida', d.id_unidad)],
                ['Merma', (d) => num(d.merma_asociada)],
            ] },
            { title: 'Lotes producidos', table: 'lote_inventario', fk: 'id_orden_produccion', columns: [
                ['Lote', (r) => cellText(r.codigo_lote)],
                ['Producto', (r) => labelFor('item', r.id_item)],
                ['Cantidad', (r) => num(r.cantidad_inicial)],
                ['Unidad', (r) => labelFor('unidad_medida', r.id_unidad)],
                ['Vencimiento', (r) => fmtDate(r.fecha_vencimiento)],
                ['Estado', (r) => pill(r.estado)],
            ] },
            { title: 'Mermas de los insumos', custom: 'productionWaste', fk: 'id_orden_produccion' },
        ],
    },
    costo_receta: {
        title: 'Costos de recetas', icon: 'fa-coins', newTable: 'costo_receta',
        note: 'Cálculo de costos por receta. El detalle muestra el costo de cada insumo.',
        columns: [
            ['Receta', (r) => labelFor('receta', r.id_receta)],
            ['Fecha de cálculo', (r) => fmtDate(r.fecha_calculo)],
            ['Rendimiento', (r) => num(r.rendimiento)],
            ['Costo total', (r) => money(sumLines('costo_receta_detalle', 'id_costo_receta', r.id_costo_receta,
                (d) => Number(d.cantidad) * Number(d.costo_unitario)))],
        ],
        detail: [{ title: 'Costo de insumos', table: 'costo_receta_detalle', fk: 'id_costo_receta', columns: [
            ['Insumo', (d) => labelFor('item', d.id_item_insumo)],
            ['Cantidad', (d) => num(d.cantidad)],
            ['Unidad', (d) => labelFor('unidad_medida', d.id_unidad)],
            ['Costo unitario', (d) => money(d.costo_unitario)],
            ['Subtotal', (d) => money(Number(d.cantidad) * Number(d.costo_unitario))],
        ] }],
    },
    movimiento_inventario: {
        title: 'Movimientos de inventario', icon: 'fa-arrow-right-arrow-left',
        newTable: 'movimiento_inventario',
        note: 'Kardex real de la base. "Ver detalle" abre toda la ficha del producto: presentaciones, precios, proveedores, lotes y movimientos.',
        columns: [
            ['Producto', (r) => labelFor('item', r.id_item)],
            ['Fecha', (r) => `${fmtDate(r.fecha_movimiento)} ${fmtTime(r.fecha_movimiento)}`],
            ['Tipo', (r) => labelFor('tipo_movimiento', r.id_tipo_movimiento)],
            ['Cantidad', (r) => `${signedQty(r)} ${unitOfItem(r.id_item)}`],
            ['Lote', (r) => cellText(findRow('lote_inventario', r.id_lote)?.codigo_lote)],
            ['Usuario', (r) => labelFor('usuario', r.id_usuario)],
            ['Observaciones', (r) => cellText(r.observaciones)],
        ],
        detail: [{ title: 'Ficha del producto', custom: 'product', fk: 'id_item', columns: [] }],
    },
});

// Configuración del menú: cada módulo es un desplegable con vistas, cabeceras
// maestro-detalle y tablas independientes. Las tablas de detalle se consultan
// desde la cabecera correspondiente, no como opciones aisladas.
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
                { label: 'Proveedores (CRUD independiente)', table: 'proveedor' },
                { label: 'Órdenes de compra y su detalle', master: 'orden_compra' },
                { label: 'Recepciones y su detalle', master: 'recepcion' },
            ] },
            { key: 'produccion', label: 'Producción & Recetas', icon: 'fa-kitchen-set', children: [
                { label: 'Resumen de producción', view: 'produccion' },
                { label: 'Recetas con ingredientes', master: 'receta' },
                { label: 'Órdenes de producción y su detalle', master: 'orden_produccion' },
                { label: 'Costos de recetas', master: 'costo_receta' },
                ...tablesFor('produccion').filter((t) => !['receta', 'orden_produccion', 'costo_receta'].includes(t.table)),
            ] },
            { key: 'cargues', label: 'Cargues de Inventario', icon: 'fa-warehouse', children: [
                { label: 'Cargue de inventario (productos y stock)', view: 'inventoryLoad' },
                { label: 'Kardex: movimientos por producto', view: 'inventoryMovements' },
                { label: 'Lotes de inventario', table: 'lote_inventario' },
                { label: 'Tipos de movimiento', table: 'tipo_movimiento' },
                { label: 'Unidades de medida', table: 'unidad_medida' },
            ] },
            { key: 'sala', label: 'Mesas & Reservas', icon: 'fa-chair', children: [
                { label: 'Resumen de reservas y mesas', view: 'sala' },
                { label: 'Clientes (CRUD independiente)', table: 'cliente' },
                { label: 'Mesas (CRUD independiente)', table: 'mesa' },
                { label: 'Reservas y su detalle', master: 'reserva' },
            ] },
            { key: 'ventas', label: 'Pedidos, Ventas & Caja', icon: 'fa-cash-register', children: [
                { label: 'Resumen de ventas', view: 'ventas' },
                { label: 'Pedidos y su detalle', master: 'pedido' },
                ...tablesFor('ventas').filter((t) => t.table !== 'pedido'),
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
                { label: 'Vista general de las tablas de la interfaz', view: 'catalogos' },
                ...INTERFACE_TABLES.map((table) => ({ label: TABLE_LABELS[table], table })),
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
                                : child.master
                                    ? `master:${mod.key}:${child.master}`
                                    : `view:${child.view || mod.key}`;
                            VIEW_REGISTRY[key] = { ...child, module: mod.key, key };
                            const icon = child.master ? 'fa-list-check' : child.table ? 'fa-table' : 'fa-angle-right';
                            return `<li><button type="button" class="nav-sublink" data-view-key="${esc(key)}">
                                <i class="fa-solid ${icon}" aria-hidden="true"></i>
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
            : item.master
                ? `${titles[item.module] || ''} · ${MASTER_VIEWS[item.master].title}`
                : (item.label.startsWith('Indicadores') ? titles[item.view] : item.label);
    }

    if (!options.keepDetail) {
        currentDetail = null;
        const detailHost = document.getElementById('tableExplorerDetail');
        if (detailHost) detailHost.innerHTML = '';
    }

    if (item.table) {
        renderTableExplorer(item.table);
    } else if (item.master) {
        renderMasterView(item.master);
    } else if (item.view === 'itemUnits') {
        renderUnitsExplorer();
    } else if (item.view === 'inventoryLoad') {
        renderInventoryLoad();
    } else if (item.view === 'inventoryMovements') {
        renderMasterView('movimiento_inventario');
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

// ---------- Traducción de llaves a datos legibles ----------
const FK_REF = Object.freeze({
    id_categoria: 'categoria_item', id_categoria_gasto: 'categoria_gasto',
    id_unidad: 'unidad_medida', id_unidad_base: 'unidad_medida',
    id_unidad_compra: 'unidad_medida', id_unidad_venta: 'unidad_medida',
    id_unidad_rendimiento: 'unidad_medida',
    id_item: 'item', id_item_insumo: 'item', id_item_resultante: 'item',
    id_presentacion: 'item_presentacion', id_proveedor: 'proveedor',
    id_item_proveedor: 'item_proveedor', id_cliente: 'cliente', id_mesa: 'mesa',
    id_usuario: 'usuario', id_usuario_responsable: 'usuario', id_rol: 'roles',
    id_orden_compra: 'orden_compra', id_oc_detalle: 'orden_compra_detalle',
    id_recepcion: 'recepcion', id_recepcion_detalle: 'recepcion_detalle',
    id_pedido: 'pedido', id_pedido_detalle: 'pedido_detalle', id_reserva: 'reserva',
    id_receta: 'receta', id_costo_receta: 'costo_receta',
    id_orden_produccion: 'orden_produccion', id_op_detalle: 'orden_produccion_detalle',
    id_lote: 'lote_inventario', id_tipo_movimiento: 'tipo_movimiento',
    id_tipo_movimiento_contable: 'tipo_movimiento_contable',
    id_caja_sesion: 'caja_sesion', id_venta: 'venta', id_gasto: 'gasto_operativo',
    id_movimiento: 'movimiento_inventario',
});
const LABEL_COLS = ['nombre', 'descripcion', 'concepto', 'codigo_lote', 'numero',
    'email', 'simbolo', 'detalle', 'motivo', 'tipo', 'contacto', 'telefono',
    'observaciones', 'medio'];
const LABEL_RULES = {
    item_presentacion: (r) => `${labelFor('item', r.id_item)} · ${cellText(r.nombre)}`,
    unidad_medida: (r) => cellText(r.simbolo || r.nombre),
    orden_compra: (r) => `${labelFor('proveedor', r.id_proveedor)} · ${fmtDate(r.fecha_emision)}`,
    recepcion: (r) => `Recepción ${fmtDate(r.fecha_recepcion)}`,
    pedido: (r) => `Pedido ${fmtDate(r.fecha_hora)} ${fmtTime(r.fecha_hora)}`,
    reserva: (r) => `${labelFor('cliente', r.id_cliente)} · ${fmtDate(r.fecha)}`,
    caja_sesion: (r) => `Caja ${fmtDate(r.fecha_apertura)}`,
    venta: (r) => `Venta ${fmtDate(r.fecha_venta)}`,
    movimiento_inventario: (r) => `${labelFor('item', r.id_item)} · ${fmtDate(r.fecha_movimiento)}`,
    receta: (r) => cellText(r.nombre),
};

const pkOf = (table) => rowsOf('tables').find((t) => t.table === table)?.pk || `id_${table}`;
const humanize = (name) => name.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const num = (value) => value === null || value === undefined || value === ''
    ? '—' : Number(value).toLocaleString('es-EC', { maximumFractionDigits: 3 });
const fmtDate = (value) => value ? String(value).slice(0, 10) : '—';
const fmtTime = (value) => {
    if (!value) return '—';
    const text = String(value);
    // La API entrega "2026-10-25 13:00:00" (y a veces ISO con T).
    const match = text.match(/(?:T|\s)(\d{2}:\d{2})/);
    return match ? match[1] : text.slice(0, 5);
};
const money = (value) => `$${Number(value ?? 0).toFixed(2)}`;

function findRow(table, id) {
    if (table === 'lote_inventario_by_recepcion') {
        return rowsOf('cat:lote_inventario').find((r) => String(r.id_recepcion_detalle) === String(id)) || null;
    }
    if (!table) return null;
    const pk = pkOf(table);
    return rowsOf(`cat:${table}`).find((r) => String(r[pk]) === String(id)) || null;
}

function filtered(table, field, value) {
    return rowsOf(`cat:${table}`).filter((r) => String(r[field]) === String(value));
}

function sumLines(table, field, value, pick) {
    return filtered(table, field, value).reduce((sum, row) => sum + Number(pick ? pick(row) : row[field] ?? 0), 0);
}

function labelFor(table, value) {
    if (value === null || value === undefined || value === '') return '—';
    const row = findRow(table, value);
    if (!row) return cellText(value);
    if (LABEL_RULES[table]) return LABEL_RULES[table](row);
    const column = LABEL_COLS.find((name) => row[name] !== null && row[name] !== undefined && row[name] !== '');
    return column ? cellText(row[column]) : `${TABLE_LABELS[table] || humanize(table)}`;
}

function unitOfItem(itemId) {
    const itemRow = findRow('item', itemId);
    return labelFor('unidad_medida', itemRow?.id_unidad_base);
}

function signedQty(movement) {
    const type = findRow('tipo_movimiento', movement.id_tipo_movimiento);
    return Number(movement.cantidad ?? 0) * (Number(type?.signo ?? 1) || 1);
}

function stockOfItem(itemId) {
    return filtered('movimiento_inventario', 'id_item', itemId).reduce((sum, m) => sum + signedQty(m), 0);
}

function detailRowsHtml(columns, rows) {
    if (!columns.length) return '';
    return `<div class="table-responsive"><table class="admin-table">
        <thead><tr>${columns.map(([label]) => `<th scope="col">${esc(label)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${columns.map(([, render]) =>
            `<td>${render(row)}</td>`).join('')}</tr>`).join('')
            || `<tr><td class="table-empty" colspan="${columns.length}">Sin líneas registradas.</td></tr>`}
        </tbody></table></div>`;
}

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
    card.innerHTML = `<div class="card-header-bar">
            <h2><i class="fa-solid fa-table" aria-hidden="true"></i> ${esc(TABLE_LABELS[table] || table)}
                <span class="catalog-count">${rows.length} registro(s)</span></h2>
            <button type="button" class="btn-gold" data-new-table="${esc(table)}">
                <i class="fa-solid fa-plus" aria-hidden="true"></i> Nuevo
            </button>
        </div>${tableRowsHtml(table, rows, pk)}`;
}

function renderAllCatalogs() {
    let zone = document.getElementById('catalog-zone-catalogos');
    if (!zone) {
        const section = document.getElementById('catalogos');
        zone = document.createElement('div');
        zone.id = 'catalog-zone-catalogos';
        section?.appendChild(zone);
    }
    INTERFACE_TABLES.forEach((table) => renderCatalogCard(zone, table));
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

// ---------- Explorador genérico: una tabla por opción del menú ----------
// Las llaves foráneas se traducen a nombres reales: el panel nunca muestra
// identificadores crudos, esos quedan en la base de datos y en los comboboxes.
function tableRowsHtml(table, rows, pk) {
    const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter((k) => k !== 'password_hash');
    const columns = keys.filter((key) => !/^id_/.test(key));
    const shown = columns.length ? columns : ['__label__'];
    const detail = DETAIL_MAP[table];
    const label = (row, column) => column === '__label__'
        ? esc(Object.keys(row).filter((key) => /^id_/.test(key))
            .map((key) => labelFor(FK_REF[key], row[key])).join(' · '))
        : esc(cellText(row[column]));
    return `<div class="table-responsive"><table class="admin-table">
        <thead><tr>${shown.map((c) => `<th scope="col">${c === '__label__' ? 'Registro' : esc(humanize(c))}</th>`).join('')}
            <th scope="col">Acciones</th></tr></thead>
        <tbody>${rows.map((row) => `<tr>
            ${shown.map((c) => `<td>${label(row, c)}</td>`).join('')}
            <td class="table-actions">
                <button type="button" data-edit="${esc(table)}" data-id="${esc(row[pk])}">Editar</button>
                ${detail ? `<button type="button" data-detail="${esc(table)}" data-detail-id="${esc(row[pk])}"
                    data-detail-fk="${esc(detail.fk)}"><i class="fa-solid fa-list-check" aria-hidden="true"></i> Ver detalle</button>` : ''}
                <button type="button" class="danger" data-delete="${esc(table)}" data-id="${esc(row[pk])}">Eliminar</button>
            </td></tr>`).join('') || `<tr><td class="table-empty" colspan="${shown.length + 1}">Sin registros en ${esc(TABLE_LABELS[table] || table)}.</td></tr>`}
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

// ---------- Cabecera → detalle con datos legibles ----------
function renderMasterView(table) {
    const view = MASTER_VIEWS[table];
    if (!view) return renderTableExplorer(table);
    const rows = rowsOf(`cat:${table}`);
    const pk = pkOf(table);
    setExplorerHeader(
        `<i class="fa-solid ${esc(view.icon)}" aria-hidden="true"></i> ${esc(view.title)}
         <span class="catalog-count">${rows.length} registro(s)</span>`,
        view.note,
        view.customNew ? null : (view.newTable || table)
    );
    const newButton = document.getElementById('tableExplorerNew');
    if (view.customNew === 'recipe' && newButton) {
        newButton.hidden = false;
        newButton.dataset.recipeNew = 'true';
        delete newButton.dataset.newTable;
        newButton.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i> Nueva receta';
    }
    const host = document.getElementById('tableExplorerTable');
    if (host) {
        host.innerHTML = `<div class="table-responsive"><table class="admin-table">
            <thead><tr>${view.columns.map(([label]) => `<th scope="col">${esc(label)}</th>`).join('')}
                <th scope="col">Acciones</th></tr></thead>
            <tbody>${rows.map((row) => `<tr>
                ${view.columns.map(([, render]) => `<td>${render(row)}</td>`).join('')}
                <td class="table-actions">
                    <button type="button" data-edit="${esc(table)}" data-id="${esc(row[pk])}">Editar</button>
                    ${table === 'movimiento_inventario'
                        ? `<button type="button" data-product-detail="${esc(row.id_item)}">Ver ficha del producto</button>`
                        : `<button type="button" data-detail="${esc(table)}" data-detail-id="${esc(row[pk])}">
                            <i class="fa-solid fa-list-check" aria-hidden="true"></i> Ver detalle</button>`}
                    ${view.customNew === 'recipe'
                        ? `<button type="button" data-recipe-edit="${esc(row[pk])}">Gestionar ingredientes</button>` : ''}
                    <button type="button" class="danger" data-delete="${esc(table)}" data-id="${esc(row[pk])}">Eliminar</button>
                </td></tr>`).join('') || `<tr><td class="table-empty" colspan="${view.columns.length + 1}">Sin registros en ${esc(view.title)}.</td></tr>`}
            </tbody></table></div>`;
    }
    wireTableActions('tableExplorer', refreshActive);
    activateSection('tableExplorer');
}

function detailToolbar(title, subtitle) {
    return `<div class="detail-toolbar">
        <div><strong>${title}</strong>${subtitle ? `<span class="catalog-count">${subtitle}</span>` : ''}</div>
        <button type="button" class="btn-red" id="detailClose">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i> Cerrar detalle y volver
        </button>
    </div>`;
}

// Al abrir el detalle se baja hasta él y se le entrega el foco; al cerrar se
// regresa al botón que lo abrió para no perder el lugar dentro de la tabla.
function scrollMotion() {
    return document.documentElement.classList.contains('a11y-reduced') ? 'auto' : 'smooth';
}

function revealElement(node, focus = false) {
    if (!node) return;
    if (typeof node.scrollIntoView === 'function') {
        node.scrollIntoView({ behavior: scrollMotion(), block: 'start' });
    }
    if (focus) {
        if (node.tabIndex < 0) node.tabIndex = -1;
        try { node.focus({ preventScroll: true }); }
        catch { node.focus(); }
    }
}

function detailTriggerFor(id) {
    if (id === null || id === undefined) return null;
    return [...document.querySelectorAll('#tableExplorerTable [data-detail], #tableExplorerTable [data-product-detail]')]
        .find((button) => String(button.dataset.detailId ?? button.dataset.productDetail) === String(id)) || null;
}

function revealDetail() {
    const host = document.getElementById('tableExplorerDetail');
    host?.setAttribute('aria-label', 'Detalle del registro seleccionado');
    revealElement(host, true);
}

function closeDetail() {
    const host = document.getElementById('tableExplorerDetail');
    const trigger = detailTriggerFor(currentDetail?.id);
    if (host) host.innerHTML = '';
    currentDetail = null;
    revealElement(trigger || document.getElementById('tableExplorerCard'), Boolean(trigger));
}

function wireDetailClose(host) {
    host.querySelector('#detailClose')?.addEventListener('click', closeDetail);
}

function movementDocument(row) {
    if (row.id_recepcion_detalle) {
        const line = findRow('recepcion_detalle', row.id_recepcion_detalle);
        return labelFor('recepcion', line?.id_recepcion);
    }
    if (row.id_pedido_detalle) {
        const line = findRow('pedido_detalle', row.id_pedido_detalle);
        return labelFor('pedido', line?.id_pedido);
    }
    if (row.id_op_detalle) {
        const line = findRow('orden_produccion_detalle', row.id_op_detalle);
        return labelFor('orden_produccion', line?.id_orden_produccion);
    }
    return labelFor('orden_produccion', row.id_orden_produccion);
}

function showDetail(masterTable, fk, id) {
    if (!MASTER_VIEWS[masterTable]) {
        if (DETAIL_MAP[masterTable]?.custom === 'product') showProductDetail(id);
        return;
    }
    showMasterDetail(masterTable, id);
}

function showMasterDetail(table, id) {
    const view = MASTER_VIEWS[table];
    const host = document.getElementById('tableExplorerDetail');
    if (!view || !host) return;
    currentDetail = { type: 'master', table, id };
    const rows = rowsOf(`cat:${table}`);
    const pk = pkOf(table);
    const master = rows.find((row) => String(row[pk]) === String(id)) || {};
    let html = detailToolbar(`Detalle de ${esc(view.title)}`, cellText(master.nombre || master.observaciones || view.title));
    (view.detail || []).forEach((section) => {
        let inner = '';
        let count = 0;
        let newButton = '';
        if (section.custom === 'product') {
            inner = productDetailHtml(id);
        } else if (section.custom === 'orderPayments') {
            const sales = filtered('venta', 'id_pedido', id);
            const payments = rowsOf('cat:pago').filter((p) => sales.some((v) => String(v.id_venta) === String(p.id_venta)));
            count = payments.length;
            inner = detailRowsHtml([
                ['Venta', (p) => labelFor('venta', p.id_venta)],
                ['Medio de pago', (p) => cellText(p.medio)],
                ['Monto', (p) => money(p.monto)],
                ['Estado', (p) => pill(p.estado)],
                ['Fecha', (p) => fmtDate(p.fecha_pago)],
            ], payments);
        } else if (section.custom === 'productionWaste') {
            // Las mermas se registran como movimientos de salida; se muestran
            // las que corresponden a los insumos de esta orden de producción.
            const insumoIds = filtered('orden_produccion_detalle', 'id_orden_produccion', id)
                .map((line) => String(line.id_item_insumo));
            const wastes = rowsOf('cat:merma').filter((m) => {
                const movement = findRow('movimiento_inventario', m.id_movimiento);
                return movement && insumoIds.includes(String(movement.id_item));
            });
            count = wastes.length;
            inner = detailRowsHtml([
                ['Producto', (w) => labelFor('item', findRow('movimiento_inventario', w.id_movimiento)?.id_item)],
                ['Fecha', (w) => fmtDate(findRow('movimiento_inventario', w.id_movimiento)?.fecha_movimiento)],
                ['Cantidad', (w) => num(findRow('movimiento_inventario', w.id_movimiento)?.cantidad)],
                ['Motivo', (w) => cellText(w.motivo)],
                ['Descripción', (w) => cellText(w.descripcion)],
                ['Responsable', (w) => labelFor('usuario', w.id_usuario_responsable)],
            ], wastes);
        } else {
            const sectionRows = filtered(section.table, section.fk, id);
            count = sectionRows.length;
            inner = detailRowsHtml(section.columns, sectionRows);
            const pkSection = pkOf(section.table);
            newButton = section.table === 'receta_detalle'
                ? `<button type="button" class="btn-gold" data-recipe-edit="${esc(id)}">
                    <i class="fa-solid fa-plus" aria-hidden="true"></i> Agregar ingredientes</button>`
                : `<button type="button" class="btn-gold" data-new-table="${esc(section.table)}"
                        data-prefill-fk="${esc(section.fk)}" data-prefill-id="${esc(id)}">
                    <i class="fa-solid fa-plus" aria-hidden="true"></i> Nueva línea</button>`;
        }
        html += `<div class="table-card catalog-card detail-card">
            <div class="card-header-bar">
                <h2><i class="fa-solid fa-list-check" aria-hidden="true"></i> ${esc(section.title)}
                    <span class="catalog-count">${count} fila(s)</span></h2>
                ${newButton ? `<div class="explorer-actions">${newButton}</div>` : ''}
            </div>${inner}</div>`;
    });
    host.innerHTML = html;
    wireDetailClose(host);
    revealDetail();
}

function showProductDetail(id) {
    const host = document.getElementById('tableExplorerDetail');
    if (!host) return;
    currentDetail = { type: 'product', id };
    host.innerHTML = detailToolbar('Ficha del producto', labelFor('item', id)) + productDetailHtml(id);
    wireDetailClose(host);
    revealDetail();
}

function factsHtml(pairs) {
    return `<dl class="detail-facts">${pairs.map(([label, value]) =>
        `<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
}

function productDetailHtml(id) {
    const item = findRow('item', id) || {};
    const presentations = filtered('item_presentacion', 'id_item', id);
    const suppliers = filtered('item_proveedor', 'id_item', id);
    const lots = filtered('lote_inventario', 'id_item', id);
    const movements = filtered('movimiento_inventario', 'id_item', id)
        .sort((a, b) => String(b.fecha_movimiento).localeCompare(String(a.fecha_movimiento)));
    const recipeUses = rowsOf('cat:receta_detalle').filter((r) => String(r.id_item_insumo) === String(id))
        .map((r) => ({ receta: labelFor('receta', r.id_receta), uso: 'Insumo', cantidad: r.cantidad, unidad: r.id_unidad }))
        .concat(filtered('receta', 'id_item_resultante', id).map((r) => ({
            receta: labelFor('receta', r.id_receta), uso: 'Producto terminado',
            cantidad: r.rendimiento, unidad: r.id_unidad_rendimiento,
        })));
    const purchases = filtered('orden_compra_detalle', 'id_item', id);
    const presentationIds = presentations.map((p) => String(p.id_presentacion));
    const orderLines = rowsOf('cat:pedido_detalle')
        .filter((d) => presentationIds.includes(String(d.id_presentacion)));
    const value = lots.reduce((sum, l) => sum + Number(l.cantidad_inicial ?? 0) * Number(l.costo_unitario ?? 0), 0);
    const sections = [
        { title: 'Datos del producto', html: factsHtml([
            ['Producto', esc(cellText(item.nombre))],
            ['Categoría', labelFor('categoria_item', item.id_categoria)],
            ['Tipo', esc(cellText(item.tipo_item))],
            ['Unidad base', labelFor('unidad_medida', item.id_unidad_base)],
            ['Unidad de compra', `${labelFor('unidad_medida', item.id_unidad_compra)} (factor ${num(item.factor_compra)})`],
            ['Unidad de venta', `${labelFor('unidad_medida', item.id_unidad_venta)} (factor ${num(item.factor_venta)})`],
            ['Stock por movimientos', `${num(stockOfItem(id))} ${unitOfItem(id)}`],
            ['Stock mínimo', num(item.stock_minimo)],
            ['Política de consumo', esc(cellText(item.politica_consumo))],
            ['Maneja lote', item.maneja_lote ? 'Sí' : 'No'],
            ['Perecedero', item.perecedero ? `Sí (${num(item.vida_util_dias)} días)` : 'No'],
            ['Valorización de lotes', money(value)],
            ['Estado', pill(item.activo ? 'activo' : 'inactivo')],
            ['Descripción', esc(cellText(item.descripcion))],
        ]), newButton: `<button type="button" class="btn-gold" data-edit="item" data-id="${esc(id)}">Editar producto</button>` },
        { title: 'Presentaciones y precios', rows: presentations, columns: [
            ['Presentación', (p) => esc(cellText(p.nombre))],
            ['Unidad', (p) => labelFor('unidad_medida', p.id_unidad)],
            ['Factor', (p) => num(p.factor_unidad)],
            ['Uso', (p) => [p.es_venta ? 'Venta' : '', p.es_compra ? 'Compra' : ''].filter(Boolean).join(' / ') || '—'],
            ['Precio vigente', (p) => {
                const prices = filtered('precio_venta', 'id_presentacion', p.id_presentacion)
                    .sort((a, b) => String(b.vigente_desde).localeCompare(String(a.vigente_desde)));
                return money(prices[0]?.precio ?? 0);
            }],
        ], newTable: 'item_presentacion', newFk: 'id_item', newId: id },
        { title: 'Proveedores del producto', rows: suppliers, columns: [
            ['Proveedor', (s) => labelFor('proveedor', s.id_proveedor)],
            ['Código', (s) => esc(cellText(s.codigo_proveedor))],
            ['Precio de referencia', (s) => money(s.precio_referencia)],
        ], newTable: 'item_proveedor', newFk: 'id_item', newId: id },
        { title: 'Lotes de inventario', rows: lots, columns: [
            ['Lote', (l) => esc(cellText(l.codigo_lote))],
            ['Cantidad', (l) => num(l.cantidad_inicial)],
            ['Unidad', (l) => labelFor('unidad_medida', l.id_unidad)],
            ['Costo unitario', (l) => money(l.costo_unitario)],
            ['Ingreso', (l) => fmtDate(l.fecha_ingreso)],
            ['Vencimiento', (l) => fmtDate(l.fecha_vencimiento)],
            ['Estado', (l) => pill(l.estado)],
            ['Origen', (l) => l.id_recepcion_detalle ? 'Compra' : l.id_orden_produccion ? 'Producción' : '—'],
        ], newTable: 'lote_inventario', newFk: 'id_item', newId: id },
        { title: 'Movimientos (kardex)', rows: movements, columns: [
            ['Fecha', (m) => `${fmtDate(m.fecha_movimiento)} ${fmtTime(m.fecha_movimiento)}`],
            ['Tipo', (m) => labelFor('tipo_movimiento', m.id_tipo_movimiento)],
            ['Cantidad', (m) => `${num(signedQty(m))} ${labelFor('unidad_medida', m.id_unidad)}`],
            ['Lote', (m) => esc(cellText(findRow('lote_inventario', m.id_lote)?.codigo_lote))],
            ['Documento', (m) => esc(cellText(movementDocument(m)))],
            ['Usuario', (m) => labelFor('usuario', m.id_usuario)],
            ['Observaciones', (m) => esc(cellText(m.observaciones))],
        ], newTable: 'movimiento_inventario', newFk: 'id_item', newId: id },
        { title: 'Recetas donde se usa', rows: recipeUses, columns: [
            ['Receta', (r) => esc(cellText(r.receta))],
            ['Uso', (r) => esc(cellText(r.uso))],
            ['Cantidad / rendimiento', (r) => num(r.cantidad)],
            ['Unidad', (r) => labelFor('unidad_medida', r.unidad)],
        ] },
        { title: 'Órdenes de compra del producto', rows: purchases, columns: [
            ['Orden de compra', (d) => labelFor('orden_compra', d.id_orden_compra)],
            ['Cantidad', (d) => num(d.cantidad_solicitada)],
            ['Unidad', (d) => labelFor('unidad_medida', d.id_unidad)],
            ['Precio pactado', (d) => money(d.precio_pactado)],
            ['Recibido', (d) => num(sumLines('recepcion_detalle', 'id_oc_detalle', d.id_oc_detalle, (x) => x.cantidad_recibida))],
        ], newTable: 'orden_compra_detalle', newFk: 'id_item', newId: id },
        { title: 'Pedidos del producto', rows: orderLines, columns: [
            ['Pedido', (d) => labelFor('pedido', d.id_pedido)],
            ['Presentación', (d) => labelFor('item_presentacion', d.id_presentacion)],
            ['Cantidad', (d) => num(d.cantidad)],
            ['Precio unitario', (d) => money(d.precio_unitario)],
            ['Origen', (d) => esc(cellText(d.origen))],
        ] },
    ];
    return sections.map((section) => `<div class="table-card catalog-card detail-card">
        <div class="card-header-bar">
            <h2><i class="fa-solid fa-circle-info" aria-hidden="true"></i> ${esc(section.title)}
                ${section.rows ? `<span class="catalog-count">${section.rows.length} fila(s)</span>` : ''}</h2>
            ${section.newButton || (section.newTable
                ? `<button type="button" class="btn-gold" data-new-table="${esc(section.newTable)}"
                        data-prefill-fk="${esc(section.newFk)}" data-prefill-id="${esc(section.newId)}">
                    <i class="fa-solid fa-plus" aria-hidden="true"></i> Nuevo registro</button>` : '')}
        </div>${section.html || detailRowsHtml(section.columns, section.rows)}</div>`).join('');
}

function renderInventoryLoad() {
    const items = rowsOf('cat:item');
    setExplorerHeader(
        `<i class="fa-solid fa-warehouse" aria-hidden="true"></i> Cargue de inventario
         <span class="catalog-count">${items.length} producto(s)</span>`,
        'Inventario de todo lo registrado: existencias calculadas desde los movimientos, lotes, unidades de compra/venta y valorización. Cada producto abre su ficha completa.',
        'item'
    );
    const host = document.getElementById('tableExplorerTable');
    if (host) {
        host.innerHTML = `<div class="table-responsive"><table class="admin-table">
            <thead><tr><th>Producto</th><th>Categoría</th><th>Unidad base</th>
                <th>Compra</th><th>Venta</th><th>Stock actual</th><th>Lotes</th>
                <th>Valorización</th><th>Política</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>${items.map((item) => {
                const lots = filtered('lote_inventario', 'id_item', item.id_item);
                const value = lots.reduce((sum, l) => sum + Number(l.cantidad_inicial ?? 0) * Number(l.costo_unitario ?? 0), 0);
                return `<tr>
                    <td>${esc(cellText(item.nombre))}</td>
                    <td>${labelFor('categoria_item', item.id_categoria)}</td>
                    <td>${labelFor('unidad_medida', item.id_unidad_base)}</td>
                    <td>${labelFor('unidad_medida', item.id_unidad_compra)} × ${num(item.factor_compra)}</td>
                    <td>${labelFor('unidad_medida', item.id_unidad_venta)} × ${num(item.factor_venta)}</td>
                    <td>${num(stockOfItem(item.id_item))} ${unitOfItem(item.id_item)}</td>
                    <td>${lots.length}</td>
                    <td>${money(value)}</td>
                    <td>${esc(cellText(item.politica_consumo))}</td>
                    <td>${pill(item.activo ? 'activo' : 'inactivo')}</td>
                    <td class="table-actions">
                        <button type="button" data-product-detail="${esc(item.id_item)}">
                            <i class="fa-solid fa-list-check" aria-hidden="true"></i> Ver detalle</button>
                        <button type="button" data-edit="item" data-id="${esc(item.id_item)}">Editar</button>
                    </td></tr>`;
            }).join('') || '<tr><td class="table-empty" colspan="11">No hay productos registrados.</td></tr>'}
            </tbody></table></div>`;
    }
    wireTableActions('tableExplorer', refreshActive);
    activateSection('tableExplorer');
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
    if (detail?.type === 'master') showMasterDetail(detail.table, detail.id);
    else if (detail?.type === 'product') showProductDetail(detail.id);
}

function renderDashboard() {
    const s = summary();
    setMetric('dashboard', 0, money(s.salesTotal ?? 0));
    setMetric('dashboard', 1, String(s.openCash ?? 0));
    setMetric('dashboard', 2, String(s.activeProduction ?? 0));
    setMetric('dashboard', 3, `${s.activeReservations ?? 0} reservas`);

    const movements = [
        ...rowsOf('reservations').slice(0, 4).map((r) => [
            `Reserva ${fmt(r.fecha)}`, 'Reservas', `Reserva de ${esc(r.cliente)} · mesa ${esc(r.mesa)}`,
            `${r.comensales} pers.`, `${fmt(r.fecha)} ${String(r.hora).slice(0, 5)}`, pill(r.estado),
        ]),
        ...rowsOf('orders').slice(0, 4).map((o) => [
            `Pedido ${fmt(o.fecha)}`, 'Pedidos', `Pedido de ${esc(labelFor('reserva', o.idReserva))}`,
            money(o.total), fmt(o.fecha), pill(o.estado),
        ]),
        ...rowsOf('sales').slice(0, 4).map((v) => [
            `Venta ${fmt(v.fecha_venta)}`, 'Ventas', `${esc(labelFor('pedido', v.id_pedido))} · ${esc(v.medios)}`,
            money(v.total), fmt(v.fecha_venta), pill(v.estado),
        ]),
        ...rowsOf('finance').slice(0, 4).map((a) => [
            `Asiento ${fmt(a.fecha)}`, 'Contabilidad', esc(a.detalle),
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
        <td>${esc(labelFor('orden_compra', row.id_orden_compra))}</td>
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
        <td>Reserva ${fmt(r.fecha)}</td><td>${esc(r.cliente)}</td><td>${esc(r.mesa)}</td>
        <td>${r.comensales}</td><td>${r.fecha} ${String(r.hora).slice(0, 5)}</td>
        <td>${pill(r.estado)}</td>
        <td class="table-actions">
            <div class="status-editor">
                <select data-status-reservation="${r.id}" data-original="${esc(r.estado)}" aria-label="Cambiar estado de la reserva de ${esc(r.cliente)}">
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
                <thead><tr><th>Número</th><th>Capacidad</th><th>Activa</th><th>Acciones</th></tr></thead>
                <tbody id="adminMesasBody"></tbody>
            </table></div>`;
        section.appendChild(mesasCard);
    }
    document.getElementById('adminMesasBody').innerHTML = rooms.map((room) => `<tr>
        <td>${esc(room.numero)}</td><td>${room.capacidad}</td>
        <td>${pill(room.activa ? 'activo' : 'inactivo')}</td>
        <td class="table-actions">
            <button type="button" data-room-toggle="${room.id_mesa}" data-activa="${room.activa}">${room.activa ? 'Desactivar' : 'Activar'}</button>
            <button type="button" data-edit="mesa" data-id="${room.id_mesa}">Editar</button>
        </td></tr>`).join('') || '<tr><td class="table-empty" colspan="4">No hay mesas registradas.</td></tr>';

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
        <td>Venta ${fmt(v.fecha_venta)}</td>
        <td>${esc(labelFor('caja_sesion', v.id_caja_sesion))}</td>
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
        <td>Asiento ${fmt(a.fecha)}</td>
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
        <td>${esc(u.nombre)}</td><td>${esc(u.email)}</td>
        <td>${esc(u.roles || '—')}</td><td>${pill(u.activo ? 'activo' : 'inactivo')}</td>
        <td class="table-actions"><button type="button" data-edit="usuarios" data-id="${u.id}">Editar</button></td>
    </tr>`).join('') || '<tr><td class="table-empty" colspan="5">No hay usuarios registrados.</td></tr>';
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

// ---------- Recetas: cabecera + ingredientes con comboboxes reales ----------
const RECETA_FIELDS = ['nombre', 'id_item_resultante', 'tipo', 'rendimiento',
    'id_unidad_rendimiento', 'activa'];

function fkOptionsHtml(reference, selected) {
    const options = [`<option value="">— Seleccionar ${esc(TABLE_LABELS[reference.table] || reference.table)} —</option>`]
        .concat((reference.options || []).map((option) =>
            `<option value="${esc(option.value)}" ${String(option.value) === String(selected) ? 'selected' : ''}>${esc(option.label)}</option>`));
    return options.join('');
}

function ingredientRowHtml(columns, line = {}) {
    const itemRef = columns.find((c) => c.name === 'id_item_insumo')?.reference
        || { table: 'item', options: rowsOf('cat:item').map((r) => ({ value: r.id_item, label: r.nombre })) };
    const unitRef = columns.find((c) => c.name === 'id_unidad')?.reference
        || { table: 'unidad_medida', options: rowsOf('cat:unidad_medida').map((r) =>
            ({ value: r.id_unidad, label: r.simbolo || r.nombre })) };
    return `<div class="ingredient-row" data-line-id="${esc(line.id_receta_detalle ?? '')}">
        <div class="form-field full">
            <label for="ingredient-item-${esc(line.id_receta_detalle ?? 'new')}">Insumo</label>
            <select id="ingredient-item-${esc(line.id_receta_detalle ?? 'new')}" name="id_item_insumo" required>
                ${fkOptionsHtml(itemRef, line.id_item_insumo)}</select>
        </div>
        <div class="form-field"><label>Cantidad</label>
            <input type="number" step="any" name="cantidad" value="${esc(line.cantidad ?? '')}" required></div>
        <div class="form-field"><label>Unidad</label>
            <select name="id_unidad" required>${fkOptionsHtml(unitRef, line.id_unidad)}</select></div>
        <div class="form-field"><label>Merma esperada (%)</label>
            <input type="number" step="any" name="merma_esperada_pct" value="${esc(line.merma_esperada_pct ?? 0)}"></div>
        <button type="button" class="btn-red" data-remove-ingredient aria-label="Quitar ingrediente">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
    </div>`;
}

async function openRecipeForm(id = null) {
    try {
        const [meta, detailMeta] = await Promise.all([
            adminApi('data/receta/schema'), adminApi('data/receta_detalle/schema'),
        ]);
        const row = id === null ? {} : await adminApi(`data/receta/${id}`);
        const lines = id === null ? [] : filtered('receta_detalle', 'id_receta', id);
        modalState = {
            mode: 'recipe', id,
            columns: meta.columns.filter((column) => RECETA_FIELDS.includes(column.name)),
            detailColumns: detailMeta.columns,
            lines,
        };
        document.getElementById('adminModalTitle').textContent = id === null
            ? 'Nueva receta con ingredientes' : `Editar receta: ${row.nombre ?? id}`;
        document.getElementById('adminFormFields').innerHTML = `<div class="form-grid">
                ${modalState.columns.map((column) => fieldHtml(column, row[column.name])).join('')}
            </div>
            <div class="recipe-ingredients">
                <div class="card-header-bar">
                    <h2><i class="fa-solid fa-bowl-food" aria-hidden="true"></i> Ingredientes</h2>
                    <button type="button" class="btn-gold" id="addIngredient">
                        <i class="fa-solid fa-plus" aria-hidden="true"></i> Agregar ingrediente</button>
                </div>
                <p class="form-hint">Insumo y unidad se eligen en comboboxes con los datos reales de la base.</p>
                <div id="ingredientRows">${lines.map((line) => ingredientRowHtml(detailMeta.columns, line)).join('')}</div>
            </div>`;
        document.getElementById('adminFormError').textContent = '';
        document.getElementById('adminModal').hidden = false;
        document.querySelector('#adminForm input, #adminForm select')?.focus();
    } catch (error) { toast(error.message); }
}

function collectIngredients() {
    return [...document.querySelectorAll('#ingredientRows .ingredient-row')].map((row) => ({
        id: row.dataset.lineId ? Number(row.dataset.lineId) : null,
        id_item_insumo: Number(row.querySelector('[name="id_item_insumo"]')?.value) || null,
        cantidad: Number(row.querySelector('[name="cantidad"]')?.value) || null,
        id_unidad: Number(row.querySelector('[name="id_unidad"]')?.value) || null,
        merma_esperada_pct: Number(row.querySelector('[name="merma_esperada_pct"]')?.value) || 0,
    })).filter((line) => line.id_item_insumo);
}

async function saveRecipe() {
    const form = document.getElementById('adminForm');
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
    const lines = collectIngredients();
    if (modalState.id === null) {
        const created = await adminApi('data/receta', { method: 'POST', body: JSON.stringify(values) });
        const recipeId = created.id_receta ?? created.id;
        for (const line of lines) {
            await adminApi('data/receta_detalle', {
                method: 'POST',
                body: JSON.stringify({ ...line, id: undefined, id_receta: recipeId }),
            });
        }
    } else {
        await adminApi(`data/receta/${modalState.id}`, { method: 'PATCH', body: JSON.stringify(values) });
        const kept = new Set(lines.filter((line) => line.id).map((line) => line.id));
        for (const original of modalState.lines) {
            if (!kept.has(Number(original.id_receta_detalle))) {
                await adminApi(`data/receta_detalle/${original.id_receta_detalle}`, { method: 'DELETE' });
            }
        }
        for (const line of lines) {
            const payload = { ...line };
            delete payload.id;
            await adminApi(line.id
                ? `data/receta_detalle/${line.id}`
                : 'data/receta_detalle', {
                method: line.id ? 'PATCH' : 'POST',
                body: JSON.stringify(line.id ? payload : { ...payload, id_receta: modalState.id }),
            });
        }
    }
}

async function openRecordForm(table, id = null, prefill = null) {
    try {
        const meta = await adminApi(`data/${table}/schema`);
        const row = id === null ? {} : await adminApi(`data/${table}/${id}`);
        modalState = { mode: 'record', table, id, columns: meta.columns };

        document.getElementById('adminModalTitle').textContent =
            id === null ? `Nuevo registro · ${TABLE_LABELS[table] || table}` : `Editar ${TABLE_LABELS[table] || table}`;
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
        } else if (modalState.mode === 'recipe') {
            await saveRecipe();
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
        const recipeNew = event.target.closest('[data-recipe-new]');
        if (recipeNew) { openRecipeForm(); return; }
        const recipeEdit = event.target.closest('[data-recipe-edit]');
        if (recipeEdit) { openRecipeForm(recipeEdit.dataset.recipeEdit); return; }
        const addIngredient = event.target.closest('#addIngredient');
        if (addIngredient) {
            document.getElementById('ingredientRows')?.insertAdjacentHTML('beforeend',
                ingredientRowHtml(modalState?.detailColumns || []));
            return;
        }
        const removeIngredient = event.target.closest('[data-remove-ingredient]');
        if (removeIngredient) { removeIngredient.closest('.ingredient-row')?.remove(); return; }
        const productButton = event.target.closest('[data-product-detail]');
        if (productButton) { showProductDetail(productButton.dataset.productDetail); return; }
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
