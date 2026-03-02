import { useState, useEffect } from 'react';
import { Edit2, Key, Power, ShieldCheck, Trash2 } from 'lucide-react';
import { useUsers, useRoles } from '../model/hooks';
import type { AppUser, UserFormData } from '@/shared/auth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Skeleton } from '@/shared/ui/skeleton';
import { useAuth } from '@/shared/auth';
import { useToast } from '@/shared/ui/use-toast';

const EMPTY_FORM: UserFormData = { username: '', password: '', roleId: '', active: true };

type ModalMode = 'create' | 'edit' | 'password' | 'toggle' | 'delete' | null;

interface UserListProps {
    search?: string;
}

export function UserList({ search = '' }: UserListProps) {
    const { users, isLoading, createUser, updateUser, changePassword, deactivateUser, deleteUser, isCreating, isUpdating, isModalOpen: modalOpen, setModalOpen } = useUsers();
    const { roles } = useRoles();
    const { hasPermission } = useAuth();
    const { showToast } = useToast();
    const [mode, setMode] = useState<ModalMode>(null);
    const [target, setTarget] = useState<AppUser | null>(null);
    const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (modalOpen && !mode) {
            setTarget(null); setForm(EMPTY_FORM); setError(''); setMode('create');
        }
    }, [modalOpen, mode]);

    const openEdit = (u: AppUser) => {
        if (!hasPermission('users.edit')) {
            showToast("No tienes permiso para editar usuarios", "error");
            return;
        }
        setTarget(u); setForm({ username: u.username, password: '', roleId: u.roleId, active: u.active }); setError(''); setMode('edit');
        setModalOpen(true);
    };

    const openPassword = (u: AppUser) => {
        if (!hasPermission('users.change_password')) {
            showToast("No tienes permiso para cambiar contraseñas", "error");
            return;
        }
        setTarget(u); setNewPw(''); setConfirmPw(''); setError(''); setMode('password');
        setModalOpen(true);
    };

    const closeModal = () => {
        setMode(null);
        setTarget(null);
        setError('');
        setModalOpen(false);
    };

    const handleSave = async () => {
        try {
            if (mode === 'create') await createUser(form);
            else if (mode === 'edit' && target) await updateUser({ id: target.id, data: { username: form.username, roleId: form.roleId, active: form.active } });
            closeModal();
        } catch (e) { setError(e instanceof Error ? e.message : 'Error al guardar'); }
    };

    const handlePassword = async () => {
        if (newPw.length < 4) { setError('La contraseña debe tener al menos 4 caracteres.'); return; }
        if (newPw !== confirmPw) { setError('Las contraseñas no coinciden.'); return; }
        try {
            if (target) {
                await changePassword({ userId: target.id, newPassword: newPw });
                showToast('Contraseña cambiada exitosamente', 'success');
            }
            closeModal();
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    };

    const handleToggleStatus = async () => {
        if (!hasPermission('users.edit')) {
            showToast('No tienes permiso para cambiar el estado de usuarios', 'error');
            return;
        }
        try {
            if (target) await deactivateUser(target.id);
            closeModal();
        } catch (e) { setError(e instanceof Error ? e.message : 'Error al cambiar estado'); }
    };

    const handleHardDelete = async () => {
        if (!hasPermission('users.delete')) {
            showToast('No tienes permiso para eliminar usuarios', 'error');
            return;
        }
        try {
            if (target) {
                await deleteUser(target.id);
                showToast('Usuario eliminado permanentemente.', 'success');
            }
            closeModal();
        } catch (e) { setError(e instanceof Error ? e.message : 'Error al eliminar'); }
    };

    const filtered = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>;

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="py-4 font-bold text-slate-800">Usuario</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800">Rol</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800 text-center">Estado</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800 text-center">Último acceso</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 && (
                            <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400 text-sm">No se encontraron usuarios.</TableCell></TableRow>
                        )}
                        {filtered.map(u => {
                            const role = roles.find(r => r.id === u.roleId || r.name === u.roleId);
                            const roleName = role?.name || u.roleId;

                            return (
                                <TableRow key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0 border border-slate-200">
                                                {u.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 group-hover:text-monchito-purple transition-colors">{u.username}</p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">ID: {u.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="text-[10px] font-bold gap-1 bg-slate-100 text-slate-600 border-none px-2 py-0.5 rounded-lg">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            {roleName.toUpperCase() === 'ADMIN' ? 'Administrador' : roleName}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={`font-black text-[10px] px-2.5 py-1 border-none shadow-sm rounded-lg ${u.active ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                            {u.active ? 'ACTIVO' : 'INACTIVO'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <p className="text-xs font-bold text-slate-600">{u.lastAccessAt ? new Date(u.lastAccessAt).toLocaleDateString('es-CO') : '---'}</p>
                                        <p className="text-[10px] text-slate-400">{u.lastAccessAt ? new Date(u.lastAccessAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : 'Nunca'}</p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-9 px-3 gap-2 text-xs font-bold transition-all rounded-xl ${u.active ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                onClick={() => {
                                                    if (!hasPermission('users.edit')) {
                                                        showToast('No tienes permiso para cambiar el estado', 'error');
                                                        return;
                                                    }
                                                    setTarget(u);
                                                    setMode('toggle');
                                                    setModalOpen(true);
                                                }}
                                            >
                                                <Power className="h-4 w-4" />
                                                {u.active ? 'Desactivar' : 'Activar'}
                                            </Button>

                                            <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-100 rounded-xl" onClick={() => openPassword(u)} title="Cambiar contraseña">
                                                    <Key className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-blue-50 rounded-xl" onClick={() => openEdit(u)} title="Editar">
                                                    <Edit2 className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                {u.roleId?.toUpperCase() !== 'ADMIN' && (
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-red-50 rounded-xl" onClick={() => {
                                                        if (!hasPermission('users.delete')) {
                                                            showToast('No tienes permiso para eliminar usuarios', 'error');
                                                            return;
                                                        }
                                                        setTarget(u); setMode('delete'); setError('');
                                                        setModalOpen(true);
                                                    }} title="Eliminar definitivamente">
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={modalOpen && !!mode} onOpenChange={closeModal}>
                <DialogContent className="rounded-2xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-monchito">
                            {mode === 'create' && 'Nuevo Usuario'}
                            {mode === 'edit' && 'Editar Usuario'}
                            {mode === 'password' && `Cambiar Contraseña — ${target?.username}`}
                            {mode === 'toggle' && (target?.active ? '¿Desactivar usuario?' : '¿Activar usuario?')}
                            {mode === 'delete' && '¿Eliminar usuario permanentemente?'}
                        </DialogTitle>
                    </DialogHeader>

                    {(mode === 'create' || mode === 'edit') && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="u-user" className="text-slate-700 font-semibold">Nombre de Usuario</Label>
                                <Input id="u-user" className="h-11 rounded-xl" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                            </div>
                            {mode === 'create' && (
                                <div className="space-y-2">
                                    <Label htmlFor="u-pw" className="text-slate-700 font-semibold">Contraseña</Label>
                                    <Input id="u-pw" type="password" className="h-11 rounded-xl" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="u-role" className="text-slate-700 font-semibold">Rol</Label>
                                <select id="u-role" className="w-full border border-slate-200 rounded-xl px-4 h-11 text-sm bg-white focus:ring-2 focus:ring-monchito-purple/20 transition-all outline-none" value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}>
                                    <option value="">Seleccionar rol...</option>
                                    {roles.map(r => <option key={r.id} value={r.name}>{r.name} — {r.description}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    id="u-active"
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                                    className="h-5 w-5 rounded-lg border-slate-300 text-monchito-purple focus:ring-monchito-purple"
                                    disabled={mode === 'edit' && (target?.roleId?.toUpperCase() === 'ADMIN')}
                                />
                                <Label htmlFor="u-active" className={`text-sm font-medium ${mode === 'edit' && (target?.roleId?.toUpperCase() === 'ADMIN') ? "text-slate-400" : "text-slate-700"}`}>
                                    Usuario activo {mode === 'edit' && (target?.roleId?.toUpperCase() === 'ADMIN') && "(Administradores siempre activos)"}
                                </Label>
                            </div>
                        </div>
                    )}

                    {mode === 'password' && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="pw-new" className="text-slate-700 font-semibold">Nueva Contraseña</Label>
                                <Input id="pw-new" type="password" className="h-11 rounded-xl" value={newPw} onChange={e => setNewPw(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pw-confirm" className="text-slate-700 font-semibold">Confirmar Contraseña</Label>
                                <Input id="pw-confirm" type="password" className="h-11 rounded-xl" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* Toggle Confirm */}
                    {mode === 'toggle' && (
                        <div className="py-4">
                            <p className="text-slate-600 leading-relaxed">
                                {target?.active
                                    ? `Se desactivará a "${target?.username}". No podrá iniciar sesión hasta que sea reactivado.`
                                    : `Se activará a "${target?.username}". Podrá volver a iniciar sesión en el sistema.`
                                }
                            </p>
                        </div>
                    )}

                    {/* Delete Confirm */}
                    {mode === 'delete' && (
                        <div className="space-y-4 py-4">
                            <p className="text-slate-600 leading-relaxed">
                                Estás a punto de eliminar permanentemente a <span className="font-bold text-slate-900">"{target?.username}"</span>.
                                Esta acción no se puede deshacer.
                            </p>
                            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                                <p className="text-xs text-rose-700 font-semibold uppercase tracking-wider mb-2">Advertencia</p>
                                <ul className="text-xs text-rose-600 space-y-1 instance-list list-disc list-inside">
                                    <li>El usuario perderá todo acceso al sistema.</li>
                                    <li>Si el usuario tiene registros vinculados (ej. pedidos, abonos), <span className="font-bold underline">el borrado fallará por seguridad.</span></li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {error && <p className="text-sm text-rose-600 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 font-medium animate-in slide-in-from-top-1">{error}</p>}

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={closeModal} className="h-11 px-6 rounded-xl border-slate-200">Cancelar</Button>

                        {(mode === 'create' || mode === 'edit') && (
                            <Button onClick={handleSave} disabled={!form.username || isCreating || isUpdating} className="h-11 px-8 rounded-xl bg-monchito-purple hover:bg-monchito-purple-dark text-white font-semibold shadow-monchito">
                                {isCreating || isUpdating ? 'Guardando...' : 'Guardar Usuario'}
                            </Button>
                        )}

                        {mode === 'password' && (
                            <Button onClick={handlePassword} className="h-11 px-8 rounded-xl bg-monchito-purple hover:bg-monchito-purple-dark text-white font-semibold">
                                Actualizar Contraseña
                            </Button>
                        )}

                        {mode === 'toggle' && (
                            <Button
                                variant={target?.active ? "destructive" : "default"}
                                className={`h-11 px-8 rounded-xl font-semibold shadow-monchito ${!target?.active ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                                onClick={handleToggleStatus}
                            >
                                {target?.active ? 'Confirmar Desactivación' : 'Confirmar Activación'}
                            </Button>
                        )}

                        {mode === 'delete' && (
                            <Button variant="destructive" onClick={handleHardDelete} className="h-11 px-8 rounded-xl font-semibold shadow-monchito">
                                Eliminar Permanentemente
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
