
import { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useRoles } from '../model/hooks';
import type { AppRole, RoleFormData, RoleName } from '@/shared/auth';
import type { Permission } from '@/shared/lib/permissions';
import { MODULES, MODULE_ACTIONS, MODULE_LABELS, ACTION_LABELS } from '@/shared/lib/permissions';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';

const ROLE_NAMES: RoleName[] = ['ADMIN', 'CAJERA', 'OPERADOR', 'VENDEDOR'];

const EMPTY_FORM: RoleFormData = { name: 'OPERADOR', description: '', permissions: [], active: true };

export function RoleList() {
    const { roles, isLoading, createRole, updateRole, deleteRole } = useRoles();
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AppRole | null>(null);
    const [editTarget, setEditTarget] = useState<AppRole | null>(null);
    const [form, setForm] = useState<RoleFormData>(EMPTY_FORM);
    const [error, setError] = useState('');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    const toggleModuleExpand = (mod: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            next.has(mod) ? next.delete(mod) : next.add(mod);
            return next;
        });
    };

    const togglePermission = (perm: Permission) => {
        setForm(f => {
            const exists = f.permissions.includes(perm);
            return { ...f, permissions: exists ? f.permissions.filter(p => p !== perm) : [...f.permissions, perm] };
        });
    };

    const toggleModuleAll = (mod: string) => {
        const actions = MODULE_ACTIONS[mod as keyof typeof MODULE_ACTIONS] ?? [];
        const perms = actions.map(a => `${mod}.${a}` as Permission);
        const allSelected = perms.every(p => form.permissions.includes(p));
        setForm(f => ({
            ...f,
            permissions: allSelected
                ? f.permissions.filter(p => !perms.includes(p))
                : [...new Set([...f.permissions, ...perms])],
        }));
    };

    const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setError(''); setExpandedModules(new Set()); setModalOpen(true); };
    const openEdit = (role: AppRole) => {
        setEditTarget(role);
        setForm({ name: role.name, description: role.description, permissions: [...role.permissions], active: role.active });
        setError(''); setExpandedModules(new Set()); setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editTarget) await updateRole({ id: editTarget.id, data: form });
            else await createRole(form);
            setModalOpen(false);
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    };

    const handleDelete = async () => {
        try {
            if (deleteTarget) await deleteRole(deleteTarget.id);
            setDeleteTarget(null);
        } catch (e) { setError(e instanceof Error ? e.message : 'Error al eliminar'); }
    };

    if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">Configura los roles y sus permisos de acceso.</p>
                <Button size="sm" onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> Nuevo Rol
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {roles.map(role => {
                    const permCount = role.permissions.length;
                    return (
                        <div key={role.id} className={`rounded-xl border p-4 space-y-3 ${role.active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800">{role.name}</h3>
                                        <Badge variant="outline" className="text-xs">{permCount} permisos</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(role)}>
                                        <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setError(''); setDeleteTarget(role); }}>
                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {MODULES.map(mod => {
                                    const hasAny = role.permissions.some(p => p.startsWith(`${mod}.`));
                                    if (!hasAny) return null;
                                    return (
                                        <span key={mod} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                            {MODULE_LABELS[mod]}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Role Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Nombre del Rol</Label>
                                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value as RoleName }))}>
                                    {ROLE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Descripción</Label>
                                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del rol..." />
                            </div>
                        </div>

                        {/* Permissions Matrix */}
                        <div className="space-y-1">
                            <Label>Permisos por Módulo</Label>
                            <div className="border rounded-xl overflow-hidden divide-y">
                                {MODULES.map(mod => {
                                    const actions = MODULE_ACTIONS[mod];
                                    const perms = actions.map(a => `${mod}.${a}` as Permission);
                                    const selectedCount = perms.filter(p => form.permissions.includes(p)).length;
                                    const allSelected = selectedCount === perms.length;
                                    const expanded = expandedModules.has(mod);

                                    return (
                                        <div key={mod}>
                                            <div
                                                className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                                                onClick={() => toggleModuleExpand(mod)}
                                            >
                                                {expanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onChange={() => toggleModuleAll(mod)}
                                                    onClick={e => e.stopPropagation()}
                                                    className="h-4 w-4 rounded"
                                                />
                                                <span className="font-medium text-sm text-slate-700">{MODULE_LABELS[mod]}</span>
                                                <span className="ml-auto text-xs text-slate-400">{selectedCount}/{perms.length}</span>
                                            </div>
                                            {expanded && (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-4 py-3 bg-white">
                                                    {perms.map(perm => {
                                                        const action = perm.split('.')[1];
                                                        return (
                                                            <label key={perm} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={form.permissions.includes(perm)}
                                                                    onChange={() => togglePermission(perm)}
                                                                    className="h-4 w-4 rounded"
                                                                />
                                                                {ACTION_LABELS[action] ?? action}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input id="role-active" type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="h-4 w-4" />
                            <Label htmlFor="role-active">Rol activo</Label>
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={!form.description}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>¿Eliminar rol?</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-600">Se eliminará el rol <span className="font-semibold">"{deleteTarget?.name}"</span>. Solo puedes eliminar roles sin usuarios asignados.</p>
                    {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
