
import { useState } from 'react';
import { Plus, Edit2, Key, Power, ShieldCheck } from 'lucide-react';
import { useUsers, useRoles } from '../model/hooks';
import type { AppUser, UserFormData } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Skeleton } from '@/shared/ui/skeleton';

const EMPTY_FORM: UserFormData = { firstName: '', lastName: '', email: '', password: '', roleId: '', active: true };

type ModalMode = 'create' | 'edit' | 'password' | 'delete' | null;

export function UserList() {
    const { users, isLoading, createUser, updateUser, changePassword, deactivateUser, isCreating, isUpdating } = useUsers();
    const { roles } = useRoles();
    const [mode, setMode] = useState<ModalMode>(null);
    const [target, setTarget] = useState<AppUser | null>(null);
    const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const openCreate = () => { setTarget(null); setForm(EMPTY_FORM); setError(''); setMode('create'); };
    const openEdit = (u: AppUser) => { setTarget(u); setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', roleId: u.roleId, active: u.active }); setError(''); setMode('edit'); };
    const openPassword = (u: AppUser) => { setTarget(u); setNewPw(''); setConfirmPw(''); setError(''); setMode('password'); };
    const openDelete = (u: AppUser) => { setTarget(u); setMode('delete'); };
    const closeModal = () => { setMode(null); setTarget(null); setError(''); };

    const handleSave = async () => {
        try {
            if (mode === 'create') await createUser(form);
            else if (mode === 'edit' && target) await updateUser({ id: target.id, data: { firstName: form.firstName, lastName: form.lastName, email: form.email, roleId: form.roleId, active: form.active } });
            closeModal();
        } catch (e) { setError(e instanceof Error ? e.message : 'Error al guardar'); }
    };

    const handlePassword = async () => {
        if (newPw.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
        if (newPw !== confirmPw) { setError('Las contraseñas no coinciden.'); return; }
        try {
            if (target) await changePassword({ userId: target.id, newPassword: newPw });
            closeModal();
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    };

    const handleDelete = async () => {
        try {
            if (target) await deactivateUser(target.id);
            closeModal();
        } catch (e) { setError(e instanceof Error ? e.message : 'Error al desactivar'); }
    };

    const filtered = users.filter(u =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}</div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Input placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-xs" />
                <Button size="sm" onClick={openCreate} className="gap-2 shrink-0">
                    <Plus className="h-4 w-4" /> Nuevo Usuario
                </Button>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Usuario</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-center">Último acceso</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 && (
                            <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400 text-sm">No hay usuarios.</TableCell></TableRow>
                        )}
                        {filtered.map(u => {
                            const role = roles.find(r => r.id === u.roleId);
                            return (
                                <TableRow key={u.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                                {u.firstName[0]}{u.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{u.firstName} {u.lastName}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">{u.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs gap-1">
                                            <ShieldCheck className="h-3 w-3" />
                                            {role?.name ?? u.roleId}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                            {u.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center text-xs text-slate-400">
                                        {u.lastAccessAt ? new Date(u.lastAccessAt).toLocaleDateString('es-CO') : 'Nunca'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPassword(u)} title="Cambiar contraseña">
                                                <Key className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                                                <Edit2 className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            {u.active && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDelete(u)}>
                                                    <Power className="h-4 w-4 text-red-500" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Create / Edit Modal */}
            <Dialog open={mode === 'create' || mode === 'edit'} onOpenChange={closeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="u-first">Nombre</Label>
                                <Input id="u-first" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="u-last">Apellido</Label>
                                <Input id="u-last" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="u-email">Email</Label>
                            <Input id="u-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                        {mode === 'create' && (
                            <div className="space-y-1">
                                <Label htmlFor="u-pw">Contraseña</Label>
                                <Input id="u-pw" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label htmlFor="u-role">Rol</Label>
                            <select id="u-role" className="w-full border rounded-md px-3 py-2 text-sm bg-white" value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}>
                                <option value="">Seleccionar rol...</option>
                                {roles.filter(r => r.active).map(r => <option key={r.id} value={r.id}>{r.name} — {r.description}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <input id="u-active" type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="h-4 w-4" />
                            <Label htmlFor="u-active">Usuario activo</Label>
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={!form.firstName || !form.email || !form.roleId || isCreating || isUpdating}>
                            {isCreating || isUpdating ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Password Modal */}
            <Dialog open={mode === 'password'} onOpenChange={closeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cambiar Contraseña — {target?.firstName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="pw-new">Nueva Contraseña</Label>
                            <Input id="pw-new" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="pw-confirm">Confirmar Contraseña</Label>
                            <Input id="pw-confirm" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handlePassword}>Actualizar Contraseña</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deactivate Confirm Modal */}
            <Dialog open={mode === 'delete'} onOpenChange={closeModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>¿Desactivar usuario?</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-600">Se desactivará a <span className="font-semibold">"{target?.firstName} {target?.lastName}"</span>. Podrá reactivarlo editando el usuario.</p>
                    {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Desactivar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
