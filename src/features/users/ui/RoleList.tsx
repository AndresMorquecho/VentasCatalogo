import { useState, useEffect } from 'react';
import { Edit2, Trash2, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { useRoles } from '../model/hooks';
import type { AppRole, RoleFormData } from '@/shared/auth';
import type { Permission } from '@/shared/lib/permissions';
import { MODULES, MODULE_ACTIONS, MODULE_LABELS, ACTION_LABELS } from '@/shared/lib/permissions';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { useAuth } from '@/shared/auth';
import { useToast } from '@/shared/ui/use-toast';

const EMPTY_FORM: RoleFormData = { name: '' as any, description: '', permissions: [], active: true };

export function RoleList() {
    const { roles, isLoading, createRole, updateRole, deleteRole, isModalOpen, setModalOpen } = useRoles();
    const { hasPermission } = useAuth();
    const { showToast } = useToast();
    const [deleteTarget, setDeleteTarget] = useState<AppRole | null>(null);
    const [editTarget, setEditTarget] = useState<AppRole | null>(null);
    const [form, setForm] = useState<RoleFormData>(EMPTY_FORM);
    const [error, setError] = useState('');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isModalOpen && !editTarget && form.name === '') {
            setEditTarget(null); setForm(EMPTY_FORM); setError(''); setExpandedModules(new Set());
        }
    }, [isModalOpen, editTarget, form.name]);

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

    const openEdit = (role: AppRole) => {
        if (!hasPermission('users.assign_roles')) {
            showToast("No tienes permiso para editar roles", "error");
            return;
        }
        setEditTarget(role);
        setForm({ name: role.name, description: role.description, permissions: [...role.permissions], active: role.active });
        setError(''); setExpandedModules(new Set()); setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editTarget) await updateRole({ id: editTarget.id, data: form });
            else await createRole(form);
            setModalOpen(false);
            setEditTarget(null);
            setForm(EMPTY_FORM);
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    };

    const handleDelete = async () => {
        try {
            if (deleteTarget) await deleteRole(deleteTarget.id);
            setDeleteTarget(null);
        } catch (e) { setError(e instanceof Error ? e.message : 'Error al eliminar'); }
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setError('');
    };

    if (isLoading) return <div className="grid gap-4 md:grid-cols-2">{[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center">
                <p className="text-sm text-slate-500">Configura los roles y sus permisos de acceso al sistema.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {roles.map(role => {
                    const permCount = role.permissions.length;
                    return (
                        <div key={role.id} className="rounded-2xl border p-5 space-y-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-monchito-purple/5 flex items-center justify-center text-monchito-purple border border-monchito-purple/10">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-800 group-hover:text-monchito-purple transition-colors">{role.name.toUpperCase() === 'ADMIN' ? 'Administrador' : role.name}</h3>
                                            <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 px-2 py-0 border-slate-200 rounded-lg">{permCount} permisos</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-blue-50" onClick={() => openEdit(role)}>
                                        <Edit2 className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    {role.name.toUpperCase() !== 'ADMIN' && (
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-50" onClick={() => {
                                            if (!hasPermission('users.assign_roles')) {
                                                showToast("No tienes permiso para eliminar roles", "error");
                                                return;
                                            }
                                            setError('');
                                            setDeleteTarget(role);
                                        }}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 px-1">
                                {MODULES.map(mod => {
                                    const hasAny = role.permissions.some(p => p.startsWith(`${mod}.`));
                                    if (!hasAny) return null;
                                    return (
                                        <span key={mod} className="text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/50">
                                            {MODULE_LABELS[mod]}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Dialog open={isModalOpen} onOpenChange={closeModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-monchito">{editTarget ? 'Editar Rol' : 'Nuevo Rol del Sistema'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Nombre del Rol</Label>
                                <Input
                                    className="h-11 rounded-xl"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value as any }))}
                                    placeholder="Ej: SUPERVISOR"
                                    disabled={editTarget?.name?.toUpperCase() === 'ADMIN'}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Descripción</Label>
                                <Input
                                    className="h-11 rounded-xl"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Funciones del rol..."
                                    disabled={editTarget?.name?.toUpperCase() === 'ADMIN'}
                                />
                            </div>
                        </div>

                        {/* Permissions Matrix */}
                        <div className="space-y-3">
                            <Label className="text-slate-700 font-semibold text-base">Permisos y Accesos por Módulo</Label>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                {MODULES.map(mod => {
                                    const actions = MODULE_ACTIONS[mod];
                                    const perms = actions.map(a => `${mod}.${a}` as Permission);
                                    const selectedCount = perms.filter(p => form.permissions.includes(p)).length;
                                    const allSelected = selectedCount === perms.length;
                                    const expanded = expandedModules.has(mod);

                                    return (
                                        <div key={mod} className="animate-in slide-in-from-left-1 duration-200">
                                            <div
                                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${expanded ? 'bg-slate-50/50' : 'bg-white'}`}
                                                onClick={() => toggleModuleExpand(mod)}
                                            >
                                                {expanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onChange={() => toggleModuleAll(mod)}
                                                    onClick={e => e.stopPropagation()}
                                                    className="h-5 w-5 rounded-lg border-slate-300 text-monchito-purple focus:ring-monchito-purple"
                                                />
                                                <span className={`font-bold text-sm ${selectedCount > 0 ? 'text-monchito-purple' : 'text-slate-700'}`}>{MODULE_LABELS[mod]}</span>
                                                <Badge variant="secondary" className="ml-auto text-[10px] font-black tracking-widest bg-slate-200/50 text-slate-500 rounded-lg px-2">
                                                    {selectedCount}/{perms.length}
                                                </Badge>
                                            </div>
                                            {expanded && (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4 py-4 bg-white/50 border-t border-slate-50 border-dashed animate-in fade-in duration-300">
                                                    {perms.map(perm => {
                                                        const action = perm.split('.')[1];
                                                        const isSelected = form.permissions.includes(perm) || editTarget?.name?.toUpperCase() === 'ADMIN';
                                                        return (
                                                            <label key={perm} className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-monchito-purple/5 border-monchito-purple/20 shadow-sm' : 'bg-white border-slate-100'}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => togglePermission(perm)}
                                                                    className="h-4 w-4 rounded-md border-slate-300 text-monchito-purple"
                                                                    disabled={editTarget?.name?.toUpperCase() === 'ADMIN'}
                                                                />
                                                                <span className={`text-xs font-semibold ${isSelected ? 'text-monchito-purple' : 'text-slate-600'}`}>
                                                                    {ACTION_LABELS[action] ?? action}
                                                                </span>
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

                        {error && <p className="text-sm text-rose-600 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 font-medium">{error}</p>}
                    </div>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" onClick={closeModal} className="h-11 px-6 rounded-xl">Cancelar</Button>
                        <Button
                            onClick={handleSave}
                            disabled={!form.name || !form.description}
                            className="h-11 px-8 rounded-xl bg-monchito-purple hover:bg-monchito-purple-dark text-white font-semibold shadow-monchito"
                        >
                            Guardar Rol
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader><DialogTitle className="text-xl font-monchito">¿Eliminar rol del sistema?</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Se eliminará el rol <span className="font-bold text-slate-900">"{deleteTarget?.name}"</span>.
                            <br /><br />
                            Solo puedes eliminar roles que <span className="underline">no tengan usuarios actualmente vinculados</span>.
                        </p>
                    </div>
                    {error && <p className="text-sm text-rose-600 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 font-medium">{error}</p>}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-11 px-6 rounded-xl">Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} className="h-11 px-8 rounded-xl font-semibold shadow-monchito">Confirmar Eliminación</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
