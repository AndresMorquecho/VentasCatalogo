
// ─── Module Keys ──────────────────────────────────────────────────────────────
export const MODULES = [
    'dashboard',
    'orders',
    'reception',
    'delivery',
    'clients',
    'transactions',
    'payments',
    'bank_accounts',
    'inventory',
    'brands',
    'cash_closure',
    'calls',
    'loyalty',
    'users',
] as const;

export type ModuleKey = typeof MODULES[number];

// ─── Action Keys per Module ───────────────────────────────────────────────────
export const MODULE_ACTIONS: Record<ModuleKey, string[]> = {
    dashboard: ['view'],
    orders: ['view', 'create', 'edit', 'delete'],
    reception: ['view', 'confirm'],
    delivery: ['view', 'confirm'],
    clients: ['view', 'create', 'edit', 'delete'],
    transactions: ['view'],
    payments: ['view', 'create', 'delete'],
    bank_accounts: ['view', 'create', 'edit', 'delete'],
    inventory: ['view', 'edit'],
    brands: ['view', 'create', 'edit', 'delete'],
    cash_closure: ['view', 'close'],
    calls: ['view', 'create'],
    loyalty: ['view', 'manage_rules', 'manage_prizes'],
    users: ['view', 'create', 'edit', 'delete', 'change_password', 'assign_roles'],
};

// ─── String helper: "module.action" ──────────────────────────────────────────
export type Permission = `${ModuleKey}.${string}`;

// ─── Module Labels (for UI) ───────────────────────────────────────────────────
export const MODULE_LABELS: Record<ModuleKey, string> = {
    dashboard: 'Dashboard',
    orders: 'Pedidos',
    reception: 'Recepción',
    delivery: 'Entregas',
    clients: 'Empresarias',
    transactions: 'Transacciones',
    payments: 'Abonos',
    bank_accounts: 'Cuentas Bancarias',
    inventory: 'Inventario',
    brands: 'Marcas',
    cash_closure: 'Cierre de Caja',
    calls: 'Llamadas',
    loyalty: 'Fidelización',
    users: 'Usuarios y Roles',
};

export const ACTION_LABELS: Record<string, string> = {
    view: 'Ver',
    create: 'Crear',
    edit: 'Editar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    close: 'Cerrar caja',
    manage_rules: 'Gestionar reglas',
    manage_prizes: 'Gestionar premios',
    change_password: 'Cambiar contraseña',
    assign_roles: 'Asignar roles',
};
