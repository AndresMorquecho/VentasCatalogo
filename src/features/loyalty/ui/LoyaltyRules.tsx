import { useState } from 'react';
import { Plus, Edit2, Briefcase, Calendar, Target } from 'lucide-react';
import { useLoyaltyRules, useLoyaltyPrizes } from '../model/hooks';
import type { LoyaltyRule, LoyaltyRuleFormData, RuleType } from '../model/types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { useAuth } from '@/shared/auth';
import { useNotifications } from '@/shared/lib/notifications';
import { useBrandList } from '@/features/brands/api/hooks';

const RULE_TYPE_LABELS: Record<RuleType, string> = {
    POR_MONTO: 'Por Monto Gastado',
    POR_PEDIDOS: 'Por N° de Pedidos',
};

const EMPTY_FORM: LoyaltyRuleFormData = {
    name: '',
    description: '',
    type: 'POR_MONTO',
    targetValue: 100,
    resetDays: 90,
    isActive: true,
    prizeId: null,
    brandIds: [],
};

export function LoyaltyRules() {
    const {
        rules,
        isLoading,
        createRule,
        updateRule,
        isCreating,
        isUpdating
    } = useLoyaltyRules();

    const brandResponse = useBrandList();
    const brands = brandResponse.data?.data || [];
    const { prizes } = useLoyaltyPrizes();
    const { hasPermission } = useAuth();
    const { notifySuccess, notifyError } = useNotifications();

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<LoyaltyRule | null>(null);
    const [form, setForm] = useState<LoyaltyRuleFormData>(EMPTY_FORM);

    const openCreate = () => {
        if (!hasPermission('loyalty.manage_rules')) {
            notifyError({ message: "No tienes permiso para crear reglas" });
            return;
        }
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEdit = (rule: LoyaltyRule) => {
        if (!hasPermission('loyalty.manage_rules')) {
            notifyError({ message: "No tienes permiso para editar reglas" });
            return;
        }
        setEditTarget(rule);
        setForm({
            name: rule.name,
            description: rule.description || '',
            type: rule.type,
            targetValue: Number(rule.targetValue),
            resetDays: rule.resetDays,
            isActive: rule.isActive,
            prizeId: rule.prizeId,
            brandIds: rule.brands.map(b => b.brandId)
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editTarget) {
                await updateRule({ id: editTarget.id, data: form });
                notifySuccess("Regla actualizada correctamente");
            } else {
                await createRule(form);
                notifySuccess("Regla creada correctamente");
            }
            setModalOpen(false);
        } catch (error) {
            notifyError(error, "Error al guardar la regla");
        }
    };

    const toggleBrand = (brandId: string) => {
        setForm(prev => ({
            ...prev,
            brandIds: prev.brandIds.includes(brandId)
                ? prev.brandIds.filter(id => id !== brandId)
                : [...prev.brandIds, brandId]
        }));
    };

    if (isLoading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">Configura reglas basadas en monto o cantidad de pedidos por marca.</p>
                <Button size="sm" onClick={openCreate} className="gap-2 bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold rounded-xl shadow-md shadow-monchito-purple/10">
                    <Plus className="h-4 w-4" /> Nueva Regla
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {rules.length === 0 && (
                    <p className="col-span-full text-center py-20 text-slate-400 border rounded-xl border-dashed">No hay reglas activas configuradas.</p>
                )}
                {rules.map((rule: LoyaltyRule) => (
                    <div key={rule.id} className={`p-5 rounded-2xl border transition-all hover:shadow-md bg-white ${rule.isActive ? 'border-slate-200 shadow-sm' : 'border-slate-300 opacity-70 grayscale'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg leading-none mb-1">{rule.name}</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{rule.description || 'Sin descripción'}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(rule)}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-monchito-purple" />
                                <span className="text-sm font-medium">
                                    Meta: <span className="text-monchito-purple font-black">
                                        {rule.type === 'POR_MONTO' ? `$${rule.targetValue}` : `${rule.targetValue} pedidos`}
                                    </span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-amber-500" />
                                <span className="text-sm text-slate-600">
                                    Reinicio: <span className="font-semibold">{rule.resetDays || 'Nunca'} días</span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-slate-400" />
                                <div className="flex flex-wrap gap-1">
                                    {rule.brands.length === 0 ? (
                                        <span className="text-xs text-slate-400 italic">Todas las marcas</span>
                                    ) : (
                                        rule.brands.map((b: any) => (
                                            <Badge key={b.brandId} variant="secondary" className="bg-slate-100 text-[10px] px-1.5 py-0 rounded-md border-0 text-slate-600 font-bold">
                                                {b.brand.name}
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                            <Badge variant="outline" className="bg-monchito-purple/5 text-monchito-purple border-monchito-purple/20 text-[10px] uppercase font-black px-2 py-0.5 rounded-lg">
                                {RULE_TYPE_LABELS[rule.type as RuleType]}
                            </Badge>
                            {rule.isActive ? (
                                <Badge className="bg-emerald-500 text-white font-bold rounded-lg text-[10px] tracking-widest">ACTIVA</Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold rounded-lg text-[10px] tracking-widest">INACTIVA</Badge>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Rule Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            {editTarget ? 'Editar Regla' : 'Configurar Nueva Regla'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Nombre de la Regla</Label>
                                <Input 
                                    value={form.name} 
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Ej: Promo Verano - Herbalife" 
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Tipo de Regla</Label>
                                <select 
                                    value={form.type} 
                                    onChange={e => setForm(f => ({ ...f, type: e.target.value as RuleType }))}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-monchito-purple/5 transition-all"
                                >
                                    <option value="POR_MONTO">Por Monto ($)</option>
                                    <option value="POR_PEDIDOS">Por Cantidad de Pedidos</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Meta ({form.type === 'POR_MONTO' ? '$' : '#' })</Label>
                                    <Input 
                                        type="number"
                                        value={form.targetValue} 
                                        onChange={e => setForm(f => ({ ...f, targetValue: Number(e.target.value) }))}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Reinicio (Días)</Label>
                                    <Input 
                                        type="number"
                                        value={form.resetDays || ''} 
                                        onChange={e => setForm(f => ({ ...f, resetDays: e.target.value ? Number(e.target.value) : null }))}
                                        placeholder="Ej: 90"
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Premio Asociado</Label>
                                <Select 
                                    value={form.prizeId || 'none'} 
                                    onValueChange={v => setForm(f => ({ ...f, prizeId: v === 'none' ? null : v }))}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Seleccionar premio..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="none">Sin premio directo (Solo puntos)</SelectItem>
                                        {prizes.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="flex justify-between items-center text-slate-700">
                                Marcas Participantes
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase font-bold">
                                    {form.brandIds.length} selec.
                                </span>
                            </Label>
                            <div className="h-[280px] overflow-y-auto border rounded-2xl p-3 bg-slate-50/50">
                                <div className="grid gap-2">
                                    {brands.map((brand: any) => (
                                        <button
                                            key={brand.id}
                                            type="button"
                                            onClick={() => toggleBrand(brand.id)}
                                            className={`flex items-center gap-3 p-2.5 rounded-xl border text-sm transition-all text-left ${
                                                form.brandIds.includes(brand.id)
                                                    ? 'bg-monchito-purple border-monchito-purple text-white shadow-md'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${form.brandIds.includes(brand.id) ? 'bg-white text-monchito-purple border-white' : 'border-slate-300'}`}>
                                                {form.brandIds.includes(brand.id) && <div className="w-2 h-2 rounded-sm bg-monchito-purple" />}
                                            </div>
                                            {brand.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4 border-t pt-4">
                        <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">Cancelar</Button>
                        <Button 
                            className="bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold rounded-xl shadow-md shadow-monchito-purple/20"
                            onClick={handleSave} 
                            disabled={!form.name || form.brandIds.length === 0 || isCreating || isUpdating}
                        >
                            {isCreating || isUpdating ? 'Guardando...' : 'Guardar Regla'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
