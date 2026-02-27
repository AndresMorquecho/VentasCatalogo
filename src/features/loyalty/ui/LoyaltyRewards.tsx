
import { useState } from 'react';
import { Plus, Edit2, Trash2, Power, Gift, Star } from 'lucide-react';
import { useLoyaltyPrizes } from '../model/hooks';
import type { LoyaltyPrize, LoyaltyPrizeFormData, PrizeType } from '../model/types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { useAuth } from '@/shared/auth';
import { useToast } from '@/shared/ui/use-toast';

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
    pointsRequired: 100,
    isActive: true,
};

export function LoyaltyRewards() {
    const { prizes, isLoading, createPrize, updatePrize, deletePrize, togglePrize, isCreating, isUpdating } = useLoyaltyPrizes();
    const { hasPermission } = useAuth();
    const { showToast } = useToast();
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<LoyaltyPrize | null>(null);
    const [editTarget, setEditTarget] = useState<LoyaltyPrize | null>(null);
    const [form, setForm] = useState<LoyaltyPrizeFormData>(EMPTY_FORM);

    const openCreate = () => {
        if (!hasPermission('loyalty.manage_prizes')) {
            showToast("No tienes permiso para crear premios", "error");
            return;
        }
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEdit = (prize: LoyaltyPrize) => {
        if (!hasPermission('loyalty.manage_prizes')) {
            showToast("No tienes permiso para editar premios", "error");
            return;
        }
        setEditTarget(prize);
        setForm({ name: prize.name, description: prize.description, type: prize.type, pointsRequired: prize.pointsRequired, isActive: prize.isActive });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!hasPermission('loyalty.manage_prizes')) {
            showToast("No tienes permiso para guardar premios", "error");
            return;
        }
        if (editTarget) {
            await updatePrize({ id: editTarget.id, data: form });
        } else {
            await createPrize(form);
        }
        setModalOpen(false);
    };

    const handleDelete = async () => {
        if (!hasPermission('loyalty.manage_prizes')) {
            showToast("No tienes permiso para eliminar premios", "error");
            return;
        }
        if (deleteTarget) {
            await deletePrize(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    if (isLoading) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">Configura los premios canjeables por los clientes.</p>
                <Button size="sm" onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> Nuevo Premio
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {prizes.length === 0 && (
                    <p className="col-span-full text-center py-10 text-slate-400 text-sm">No hay premios configurados.</p>
                )}
                {prizes.map(prize => (
                    <div key={prize.id} className={`rounded-xl border p-4 flex flex-col gap-3 transition-all hover:shadow-md ${prize.isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-100 border-slate-300 opacity-80'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${PRIZE_TYPE_COLORS[prize.type]}`}>
                                    <Gift className="h-5 w-5" />
                                </div>
                                <Badge
                                    variant={prize.isActive ? "default" : "secondary"}
                                    className={`text-[10px] uppercase font-bold tracking-wider ${prize.isActive ? 'bg-emerald-500 hover:bg-emerald-600' : 'text-slate-500 bg-slate-200'}`}
                                >
                                    {prize.isActive ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                    if (!hasPermission('loyalty.manage_prizes')) {
                                        showToast("No tienes permiso para activar/desactivar premios", "error");
                                        return;
                                    }
                                    togglePrize(prize.id);
                                }}>
                                    <Power className={`h-3.5 w-3.5 ${prize.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(prize)}>
                                    <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                    if (!hasPermission('loyalty.manage_prizes')) {
                                        showToast("No tienes permiso para eliminar premios", "error");
                                        return;
                                    }
                                    setDeleteTarget(prize);
                                }}>
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">{prize.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{prize.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                            <Badge variant="outline" className={`text-xs ${PRIZE_TYPE_COLORS[prize.type]}`}>
                                {PRIZE_TYPE_LABELS[prize.type]}
                            </Badge>
                            <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                                <Star className="h-3.5 w-3.5" />
                                {prize.pointsRequired} pts
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editTarget ? 'Editar Premio' : 'Nuevo Premio'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="prize-name">Nombre</Label>
                            <Input id="prize-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Envío Gratis Premium" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="prize-desc">Descripción</Label>
                            <Input id="prize-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe el beneficio..." />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="prize-pts">Puntos Requeridos</Label>
                            <Input id="prize-pts" type="number" min={1} value={form.pointsRequired} onChange={e => setForm(f => ({ ...f, pointsRequired: Number(e.target.value) }))} />
                        </div>
                        <div className="flex items-center gap-3">
                            <input id="prize-active" type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
                            <Label htmlFor="prize-active">Premio activo</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={!form.name || isCreating || isUpdating}>
                            {isCreating || isUpdating ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Modal */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar premio?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600">Se eliminará permanentemente el premio <span className="font-semibold">"{deleteTarget?.name}"</span>.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
