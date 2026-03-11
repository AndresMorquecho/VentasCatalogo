import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuditLog, useUsers } from '../model/hooks';
import type { AuditSeverity, AuditEntry } from '@/shared/auth/types';
import { MODULES, MODULE_LABELS, type ModuleKey } from '@/shared/lib/permissions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Download, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { useDebounce } from '@/shared/lib/hooks';
import { Pagination } from '@/shared/ui/pagination';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; severity: AuditSeverity }> = {
    LOGIN: { label: 'Login', severity: 'INFO' },
    LOGOUT: { label: 'Logout', severity: 'INFO' },
    LOGIN_FAILED: { label: 'Login fallido', severity: 'CRITICAL' },
    CREATE_USER: { label: 'Crear usuario', severity: 'INFO' },
    UPDATE_USER: { label: 'Editar usuario', severity: 'WARNING' },
    DEACTIVATE_USER: { label: 'Desactivar usuario', severity: 'CRITICAL' },
    REACTIVATE_USER: { label: 'Reactivar usuario', severity: 'WARNING' },
    CHANGE_PASSWORD: { label: 'Cambiar contraseña', severity: 'WARNING' },
    CREATE_ROLE: { label: 'Crear rol', severity: 'INFO' },
    UPDATE_ROLE: { label: 'Editar rol', severity: 'WARNING' },
    DELETE_ROLE: { label: 'Eliminar rol', severity: 'CRITICAL' },
    CHANGE_PERMISSIONS: { label: 'Cambiar permisos', severity: 'CRITICAL' },
    CREATE_ORDER: { label: 'Crear pedido', severity: 'INFO' },
    EDIT_ORDER: { label: '', severity: 'WARNING' },
    DELETE_ORDER: { label: 'Eliminar pedido', severity: 'CRITICAL' },
    CONFIRM_RECEPTION: { label: 'Confirmar recepción', severity: 'INFO' },
    CONFIRM_DELIVERY: { label: 'Confirmar entrega', severity: 'INFO' },
    CREATE_PAYMENT: { label: 'Crear abono', severity: 'INFO' },
    DELETE_PAYMENT: { label: 'Eliminar abono', severity: 'CRITICAL' },
    CLOSE_CASH: { label: 'Cierre de caja', severity: 'WARNING' },
    CREATE_LOYALTY_RULE: { label: 'Crear regla fid.', severity: 'INFO' },
    UPDATE_LOYALTY_RULE: { label: 'Editar regla fid.', severity: 'WARNING' },
    DELETE_LOYALTY_RULE: { label: 'Eliminar regla fid.', severity: 'CRITICAL' },
    CREATE_LOYALTY_PRIZE: { label: 'Crear premio fid.', severity: 'INFO' },
    UPDATE_LOYALTY_PRIZE: { label: 'Editar premio fid.', severity: 'WARNING' },
    DELETE_LOYALTY_PRIZE: { label: 'Eliminar premio fid.', severity: 'CRITICAL' },
    LOYALTY_REDEMPTION: { label: 'Canje fidelización', severity: 'WARNING' },
    CREATE_BRAND: { label: 'Crear marca', severity: 'INFO' },
    UPDATE_BRAND: { label: 'Editar marca', severity: 'WARNING' },
    DELETE_BRAND: { label: 'Eliminar marca', severity: 'CRITICAL' },
    CREATE_CLIENT: { label: 'Crear empresaria', severity: 'INFO' },
    UPDATE_CLIENT: { label: 'Editar empresaria', severity: 'WARNING' },
    DELETE_CLIENT: { label: 'Eliminar empresaria', severity: 'CRITICAL' },
};

const SEVERITY_UI: Record<AuditSeverity, { label: string; cls: string; icon: ReactNode }> = {
    INFO: { label: 'Info', cls: 'bg-blue-100 text-blue-700', icon: <Info className="h-3 w-3" /> },
    WARNING: { label: 'Aviso', cls: 'bg-amber-100 text-amber-700', icon: <AlertTriangle className="h-3 w-3" /> },
    CRITICAL: { label: 'Crítico', cls: 'bg-red-100 text-red-700', icon: <ShieldAlert className="h-3 w-3" /> },
};

// ─── Export to CSV ────────────────────────────────────────────────────────────
function exportCSV(rows: AuditEntry[]) {
    const header = ['Fecha', 'Usuario', 'Acción', 'Módulo', 'Detalle', 'Severidad', 'Éxito'].join(',');
    const body = rows.map((e: AuditEntry) => [
        new Date(e.timestamp).toLocaleString('es-CO'),
        `"${e.userName}"`,
        e.action,
        e.module,
        `"${e.detail}"`,
        e.severity,
        e.success ? 'Sí' : 'No',
    ].join(',')).join('\n');

    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitacora_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AuditLog() {
    const [page, setPage] = useState(1);
    const [limit] = useState(100);

    // Filters
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 1000);

    const [userFilter, setUserFilter] = useState<string>('');
    const [moduleFilter, setModuleFilter] = useState<string>('');
    const [severityFilter, setSeverityFilter] = useState<AuditSeverity | ''>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { response, isLoading, isError } = useAuditLog({
        page,
        limit,
        search: debouncedSearch.length >= 3 ? debouncedSearch : undefined,
        userName: userFilter || undefined,
        module: moduleFilter || undefined,
        severity: severityFilter || undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined
    });

    const { users } = useUsers();

    const entries = response?.data || [];
    const pagination = response?.pagination;

    // Reset page on filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, userFilter, moduleFilter, severityFilter, dateFrom, dateTo]);

    const resetFilters = () => {
        setSearch(''); setUserFilter(''); setModuleFilter(''); setSeverityFilter('');
        setDateFrom(''); setDateTo(''); setPage(1);
    };

    const todayCritical = entries.filter(e => {
        const today = new Date().toDateString();
        return e.severity === 'CRITICAL' && new Date(e.timestamp).toDateString() === today;
    }).length;

    if (isLoading && entries.length === 0) {
        return <div className="py-20 text-center text-slate-400">Cargando bitácora...</div>;
    }


    if (isError) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Error al cargar la bitácora</p>
                <p className="text-sm opacity-80">Por favor, intenta recargar la página.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Critical alert banner */}
            {todayCritical > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <span className="font-medium text-sm">
                        ⚠️ {todayCritical} acción{todayCritical > 1 ? 'es' : ''} crítica{todayCritical > 1 ? 's' : ''} registrada{todayCritical > 1 ? 's' : ''} hoy.
                    </span>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[180px]">
                        <Input placeholder="Buscar por detalle o acción..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select className="border rounded-md px-3 py-2 text-sm bg-white h-10 w-44" value={userFilter} onChange={e => { setUserFilter(e.target.value); setPage(1); }}>
                        <option value="">Todos los usuarios</option>
                        {users.map(u => (
                            <option key={u.id} value={u.username}>{u.username}</option>
                        ))}
                    </select>
                    <select className="border rounded-md px-3 py-2 text-sm bg-white h-10" value={moduleFilter} onChange={e => { setModuleFilter(e.target.value); setPage(1); }}>
                        <option value="">Todos los módulos</option>
                        {MODULES.map(m => <option key={m} value={m}>{MODULE_LABELS[m as ModuleKey]}</option>)}
                        <option value="auth">Autenticación</option>
                    </select>
                    <select className="border rounded-md px-3 py-2 text-sm bg-white h-10" value={severityFilter} onChange={e => { setSeverityFilter(e.target.value as AuditSeverity | ''); setPage(1); }}>
                        <option value="">Todas las severidades</option>
                        <option value="INFO">Info</option>
                        <option value="WARNING">Aviso</option>
                        <option value="CRITICAL">Crítico</option>
                    </select>
                    <div className="flex items-center gap-2">
                        <input type="date" className="border rounded-md px-3 py-2 text-sm h-10" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
                        <span className="text-slate-400 text-sm">—</span>
                        <input type="date" className="border rounded-md px-3 py-2 text-sm h-10" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
                    </div>
                    <Button variant="outline" size="sm" onClick={resetFilters}>Limpiar</Button>
                    <Button size="sm" className="gap-2" onClick={() => exportCSV(entries)}>
                        <Download className="h-4 w-4" /> Exportar CSV
                    </Button>
                </div>
                <p className="text-xs text-slate-400">{pagination?.total ?? 0} registro{pagination?.total !== 1 ? 's' : ''} encontrado{pagination?.total !== 1 ? 's' : ''}.</p>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="w-[160px]">Fecha y Hora</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Acción</TableHead>
                            <TableHead>Módulo</TableHead>
                            <TableHead>Detalle</TableHead>
                            <TableHead className="text-center w-[100px]">Severidad</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                                    {isLoading ? 'Cargando...' : 'No hay registros que coincidan con los filtros aplicados.'}
                                </TableCell>
                            </TableRow>
                        )}
                        {entries.map(e => {
                            const meta = ACTION_META[e.action];
                            const sev = SEVERITY_UI[e.severity as AuditSeverity] ?? SEVERITY_UI.INFO;
                            return (
                                <TableRow key={e.id} className={`hover:bg-slate-50 transition-colors ${!e.success ? 'bg-red-50/40' : ''}`}>
                                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                                        {new Date(e.timestamp).toLocaleString('es-CO', {
                                            day: '2-digit', month: 'short',
                                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium text-slate-700 text-sm leading-tight">{e.userName}</p>
                                        <p className="text-xs text-slate-400">{e.userId}</p>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                            {meta?.label ?? e.action}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-slate-500">
                                            {MODULE_LABELS[e.module as ModuleKey] ?? e.module}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600 max-w-xs">
                                        <p className="truncate">{e.detail}</p>
                                        {!e.success && <span className="text-xs text-red-500 font-medium">✗ Fallido</span>}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sev.cls}`}>
                                            {sev.icon}
                                            {sev.label}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && (
                <Pagination
                    currentPage={page}
                    totalPages={pagination.pages}
                    onPageChange={setPage}
                    totalItems={pagination.total}
                    itemsPerPage={limit}
                />
            )}
        </div>
    );
}

