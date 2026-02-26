
import { useState } from 'react';
import { Plus, Edit2, Key, Power, ShieldCheck, Trash2 } from 'lucide-react';
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

export function UserList() {
    const { users, isLoading, createUser, updateUser, changePassword, deactivateUser, deleteUser, isCreating, isUpdating } = useUsers();
    const { roles } = useRoles();
    const { hasPermission } = useAuth();
    const { showToast } = useToast();
    const [mode, setMode] = useState<ModalMode>(null);
    const [target, setTarget] = useState<AppUser | null>(null);
    const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const openCreate = () => {
        if (!hasPermission('users.create')) {
            showToast("No tienes permiso para crear usuarios", "error");
            return;
        }
        setTarget(null); setForm(EMPTY_FORM); setError(''); setMode('create');
    };

    const openEdit = (u: AppUser) => {
        if (!hasPermission('users.edit')) {
            showToast("No tienes permiso para editar usuarios", "error");
            return;
        }
        setTarget(u); setForm({ username: u.username, password: '', roleId: u.roleId, active: u.active }); setError(''); setMode('edit');
    };

    const openPassword = (u: AppUser) => {
        if (!hasPermission('users.change_password')) {
            showToast("No tienes permiso para cambiar contraseñas", "error");
            return;
        }
        setTarget(u); setNewPw(''); setConfirmPw(''); setError(''); setMode('password');
    };

    const closeModal = () => { setMode(null); setTarget(null); setError(''); };

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
                            const role = roles.find(r => r.id === u.roleId || r.name === u.roleId);
                            const roleName = role?.name || u.roleId;

                            return (
                                <TableRow key={u.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0 border border-slate-200">
                                                {u.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{u.username}</p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">ID: {u.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="text-[10px] font-bold gap-1 bg-slate-100 text-slate-600 border-none px-2 py-0.5">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            {roleName.toUpperCase() === 'ADMIN' ? 'Administrador' : roleName}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <Badge className={`font-black text-[10px] px-2.5 py-0.5 border-none shadow-sm ${u.active ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                {u.active ? 'ACTIVO' : 'INACTIVO'}
                                            </Badge>
                                        </div>
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
                                                className={`h-8 px-2 gap-1.5 text-xs font-bold transition-all ${u.active ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                onClick={() => {
                                                    if (!hasPermission('users.edit')) {
                                                        showToast('No tienes permiso para cambiar el estado', 'error');
                                                        return;
                                                    }
                                                    setTarget(u);
                                                    setMode('toggle');
                                                }}
                                            >
                                                <Power className="h-3.5 w-3.5" />
                                                {u.active ? 'Desactivar' : 'Activar'}
                                            </Button>

                                            <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => openPassword(u)} title="Cambiar contraseña">
                                                    <Key className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50" onClick={() => openEdit(u)} title="Editar">
                                                    <Edit2 className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                {u.roleId?.toUpperCase() !== 'ADMIN' && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => {
                                                        if (!hasPermission('users.delete')) {
                                                            showToast('No tienes permiso para eliminar usuarios', 'error');
                                                            return;
                                                        }
                                                        setTarget(u); setMode('delete'); setError('');
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

            {/* Create / Edit Modal */}
            <Dialog open={mode === 'create' || mode === 'edit'} onOpenChange={closeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="u-user">Nombre de Usuario</Label>
                            <Input id="u-user" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
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
                                {roles.map(r => <option key={r.id} value={r.name}>{r.name} — {r.description}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                id="u-active"
                                type="checkbox"
                                checked={form.active}
                                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                                className="h-4 w-4"
                                disabled={mode === 'edit' && (target?.roleId?.toUpperCase() === 'ADMIN')}
                            />
                            <Label htmlFor="u-active" className={mode === 'edit' && (target?.roleId?.toUpperCase() === 'ADMIN') ? "text-slate-400" : ""}>
                                Usuario activo {mode === 'edit' && (target?.roleId?.toUpperCase() === 'ADMIN') && "(Administradores siempre activos)"}
                            </Label>
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={!form.username || isCreating || isUpdating}>
                            {isCreating || isUpdating ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Password Modal */}
            <Dialog open={mode === 'password'} onOpenChange={closeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cambiar Contraseña — {target?.username}</DialogTitle>
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

            {/* Deactivate/Activate Confirm Modal */}
            <Dialog open={mode === 'toggle'} onOpenChange={closeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{target?.active ? '¿Desactivar usuario?' : '¿Activar usuario?'}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600">
                        {target?.active
                            ? `Se desactivará a "${target?.username}". No podrá iniciar sesión hasta que sea reactivado.`
                            : `Se activará a "${target?.username}". Podrá volver a iniciar sesión en el sistema.`
                        }
                    </p>
                    {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                        <Button
                            variant={target?.active ? "destructive" : "default"}
                            className={!target?.active ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                            onClick={handleToggleStatus}
                        >
                            {target?.active ? 'Confirmar Desactivación' : 'Confirmar Activación'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Hard Delete Confirm Modal */}
            <Dialog open={mode === 'delete'} onOpenChange={closeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar usuario permanentemente?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600">
                            Estás a punto de eliminar permanentemente a <span className="font-bold">"{target?.username}"</span>.
                            Esta acción no se puede deshacer.
                        </p>
                        <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside bg-slate-50 p-3 rounded-lg border">
                            <li>El usuario perderá todo acceso al sistema.</li>
                            <li>Si el usuario tiene registros vinculados (ej. pedidos, abonos), <span className="text-red-600 font-bold">el borrado fallará por seguridad.</span> En ese caso, debes usar la opción de "Desactivar".</li>
                        </ul>
                        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleHardDelete}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
