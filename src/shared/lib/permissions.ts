
// ─── Module Keys ──────────────────────────────────────────────────────────────
export const MODULES = [
    'dashboard',
    'orders',
    'reception',
    'delivery',
    'clients',
    'transactions',
    'payments',
    'wallet',
    'wallet_validations',
    'bank_accounts',
    'inventory',
    'brands',
    'catalogs',
    'cash_closure',
    'cartera',
    'calls',
    'loyalty',
    'users',
    'exchanges',
    'system_config',
] as const;

export type ModuleKey = typeof MODULES[number];

// ─── Action Keys per Module ───────────────────────────────────────────────────
export const MODULE_ACTIONS: Record<ModuleKey, string[]> = {
    dashboard: ['view'],
    orders: ['view', 'create', 'edit', 'delete', 'delete_item', 'save_with_zero_deposit', 'edit_price', 'export_excel'],
    reception: ['view', 'confirm', 'edit', 'delete', 'export_excel'],
    delivery: ['view', 'confirm', 'dismantle', 'return', 'export_excel'],
    clients: ['view', 'create', 'edit', 'delete', 'update', 'export_excel'],
    transactions: ['view', 'export_excel'],
    payments: ['view', 'create', 'delete', 'export_excel'],
    wallet: ['view', 'recharge'],
    wallet_validations: ['view', 'validate', 'reject'],
    bank_accounts: ['view', 'create', 'edit', 'delete', 'toggle_status'],
    inventory: ['view', 'export_excel'],
    brands: ['view', 'create', 'edit', 'delete', 'toggle_status'],
    catalogs: ['view', 'register', 'deliver'],
    cash_closure: ['view', 'view_all', 'close', 'delete', 'export_excel'],
    cartera: ['view', 'export_excel'],
    calls: ['view', 'create', 'delete'],
    loyalty: [
        'view', 
        'create_rule', 'edit_rule', 'delete_rule', 
        'create_prize', 'edit_prize', 'delete_prize', 
        'redeem'
    ],
    users: ['view', 'create', 'edit', 'delete', 'change_password', 'assign_roles', 'export_excel'],
    exchanges: ['view', 'create', 'edit', 'delete', 'save_with_zero_deposit', 'export_excel'],
    system_config: [
        'view',
        'create_notimonchito', 
        'edit_notimonchito', 
        'delete_notimonchito', 
        'edit_parameters'
    ],
};

// ─── String helper: "module.action" ──────────────────────────────────────────
export type Permission = `${ModuleKey}.${string}`;

// ─── Module Labels (for UI) ───────────────────────────────────────────────────
export const MODULE_LABELS: Record<ModuleKey, string> = {
    dashboard: 'Dashboard',
    orders: 'Pedidos',
    reception: 'Recepción de Pedidos',
    delivery: 'Entregas de Pedidos',
    clients: 'Empresarias (Clientes)',
    transactions: 'Transacciones Globales',
    payments: 'Abonos',
    wallet: 'Billetera Virtual',
    wallet_validations: 'Validación de Pagos',
    bank_accounts: 'Gestión Financiera (Bancos)',
    inventory: 'Inventario',
    brands: 'Marcas',
    catalogs: 'Catálogos/Logística',
    cash_closure: 'Control de Caja',
    cartera: 'Análisis de Cartera',
    calls: 'Registro de Llamadas',
    loyalty: 'Fidelización de Clientes',
    users: 'Usuarios y Roles',
    exchanges: 'Cambios y Devoluciones',
    system_config: 'Configuración del Sistema',
};

export const ACTION_LABELS: Record<string, string> = {
    view: 'Ver/Acceder',
    view_all: 'Ver Todo (Admin)',
    create: 'Crear Nuevo',
    edit: 'Editar',
    delete: 'Eliminar',
    update: 'Actualizar',
    confirm: 'Confirmar/Finalizar',
    dismantle: 'Desmantelar',
    return: 'Regresar Entrega',
    save_with_zero_deposit: 'Guardar con Abono $0',
    delete_item: 'Eliminar Item Individual',
    recharge: 'Recargar Billetera',
    validate: 'Validar Pago',
    reject: 'Rechazar Pago',
    toggle_status: 'Activar/Desactivar',
    register: 'Registrar',
    deliver: 'Entregar',
    close: 'Realizar Cierre',
    create_rule: 'Crear Regla',
    edit_rule: 'Editar Regla',
    delete_rule: 'Eliminar Regla',
    create_prize: 'Crear Premio',
    edit_prize: 'Editar Premio',
    delete_prize: 'Eliminar Premio',
    redeem: 'Realizar Canje',
    create_notimonchito: 'Crear Notimonchito',
    edit_notimonchito: 'Editar Notimonchito',
    delete_notimonchito: 'Eliminar Notimonchito',
    edit_parameters: 'Editar Parámetros',
    change_password: 'Cambiar Contraseña',
    assign_roles: 'Asignar Roles',
    edit_price: 'Corregir Precio de Pedido',
    export_excel: 'Exportar a Excel',
};
