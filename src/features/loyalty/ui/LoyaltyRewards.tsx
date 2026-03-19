import { useState } from 'react';
import { Plus, Edit2, Trash2, Gift, Star } from 'lucide-react';
import { useLoyaltyPrizes } from '../model/hooks';
import type { LoyaltyPrize, LoyaltyPrizeFormData, PrizeType } from '../model/types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { useAuth } from '@/shared/auth';
import { useNotifications } from '@/shared/lib/notifications';

const PRIZE_TYPE_LABELS: Record<PrizeType, string> = {
    DESCUENTO_PORCENTAJE: 'Descuento %',
    ENVIO_GRATIS: 'Envío Gratis',
    DESCUENTO_FIJO: 'Descuento Fijo',
    PEDIDO_ESPECIAL: 'Pedido Especial',
};

const PRIZE_TYPE_COLORS: Record<PrizeType, string> = {
    DESCUENTO_PORCENTAJE: 'bg-blue-100 text-blue-700',
    ENVIO_GRATIS: 'bg-emerald-100 text-emerald-700',
    DESCUENTO_FIJO: 'bg-amber-100 text-amber-700',
    PEDIDO_ESPECIAL: 'bg-purple-100 text-purple-700',
};

const EMPTY_FORM: LoyaltyPrizeFormData = {
    name: '',
    description: '',
    type: 'ENVIO_GRATIS',
    pointsRequired: 0,
    isActive: true,
};

export function LoyaltyRewards() {
    const {
        prizes,
        isLoading,
        createPrize,
        updatePrize,
        deletePrize,
        isCreating,
        isUpdating
    } = useLoyaltyPrizes();

    const { hasPermission } = useAuth();
    const { notifySuccess, notifyError } = useNotifications();

    const [modalOpen, setModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<LoyaltyPrize | null>(null);
    const [editTarget, setEditTarget] = useState<LoyaltyPrize | null>(null);
    const [form, setForm] = useState<LoyaltyPrizeFormData>(EMPTY_FORM);

    const openCreate = () => {
        if (!hasPermission('loyalty.manage_prizes')) {
            notifyError({ message: "No tienes permiso para crear premios" });
            return;
        }
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEdit = (prize: LoyaltyPrize) => {
        if (!hasPermission('loyalty.manage_prizes')) {
            notifyError({ message: "No tienes permiso para editar premios" });
            return;
        }
        setEditTarget(prize);
        setForm({ 
            name: prize.name, 
            description: prize.description || '', 
            type: prize.type, 
            pointsRequired: prize.pointsRequired || 0, 
            isActive: prize.isActive 
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editTarget) {
                await updatePrize({ id: editTarget.id, data: form });
                notifySuccess(`Premio "${form.name}" actualizado correctamente`);
            } else {
                await createPrize(form);
                notifySuccess(`Premio "${form.name}" creado correctamente`);
            }
            setModalOpen(false);
        } catch (error) {
            notifyError(error, "Error al guardar el premio");
        }
    };

    const handleDelete = async () => {
        if (deleteTarget) {
            try {
                await deletePrize(deleteTarget.id);
                notifySuccess(`Premio "${deleteTarget.name}" eliminado correctamente`);
                setDeleteTarget(null);
            } catch (error) {
                notifyError(error, "Error al eliminar el premio");
            }
        }
    };

    if (isLoading) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-44 w-full rounded-3xl" />)}</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">Configura los beneficios que los clientes obtienen al cumplir reglas.</p>
                <Button size="sm" onClick={openCreate} className="gap-2 rounded-xl bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold shadow-md shadow-monchito-purple/10">
                    <Plus className="h-4 w-4" /> Nuevo Premio
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {prizes.length === 0 && (
                    <p className="col-span-full text-center py-20 text-slate-400 border rounded-3xl border-dashed">No hay premios configurados.</p>
                )}
                {prizes.map((prize) => (
                    <div key={prize.id} className={`rounded-3xl border p-6 flex flex-col gap-4 transition-all hover:shadow-lg group ${prize.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                        <div className="flex justify-between items-start">
                            <div className={`p-4 rounded-2xl ${PRIZE_TYPE_COLORS[prize.type] || 'bg-slate-100 text-slate-600'}`}>
                                <Gift className="h-6 w-6" />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(prize)}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(prize)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900 text-lg leading-tight">{prize.name}</h3>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{prize.description || 'Sin descripción detallada'}</p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                            <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIZE_TYPE_COLORS[prize.type] || 'bg-slate-100'}`}>
                                {PRIZE_TYPE_LABELS[prize.type]}
                            </Badge>
                            {(prize.pointsRequired || 0) > 0 ? (
                                <span className="flex items-center gap-1.5 text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-xl">
                                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                    {prize.pointsRequired} pts
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg">Rule Prize</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Editor Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="rounded-3xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{editTarget ? 'Editar Premio' : 'Nuevo Premio'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label>Nombre</Label>
                            <Input 
                                value={form.name} 
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                                placeholder="Ej: Bono de Descuento 10%" 
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Descripción</Label>
                            <Input 
                                value={form.description || ''} 
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                                placeholder="Breve explicación del premio"
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tipo de Beneficio</Label>
                            <select 
                                value={form.type} 
                                onChange={e => setForm(f => ({ ...f, type: e.target.value as PrizeType }))}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                            >
                                {Object.entries(PRIZE_TYPE_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Puntos (0 si es de regla)</Label>
                                <Input 
                                    type="number" 
                                    value={form.pointsRequired ?? ''} 
                                    onChange={e => setForm(f => ({ ...f, pointsRequired: Number(e.target.value) }))} 
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                                <input 
                                    type="checkbox" 
                                    checked={form.isActive} 
                                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} 
                                    className="h-4 w-4 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900" 
                                />
                                <Label>Activo</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">Cancelar</Button>
                        <Button 
                            className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold rounded-xl" 
                            onClick={handleSave} 
                            disabled={!form.name || isCreating || isUpdating}
                        >
                            {isCreating || isUpdating ? 'Guardando...' : 'Guardar Premio'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent className="rounded-3xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">¿Eliminar premio?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-500">
                        Esta acción borrará el premio <span className="font-bold text-slate-800">"{deleteTarget?.name}"</span>. 
                        No se puede deshacer.
                    </p>
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl flex-1">Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} className="rounded-xl flex-1">Si, eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
