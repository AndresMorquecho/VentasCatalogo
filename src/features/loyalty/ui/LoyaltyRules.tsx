
import { useState } from 'react';
import { Plus, Edit2, Power } from 'lucide-react';
import { useLoyaltyRules } from '../model/hooks';
import type { LoyaltyRule, LoyaltyRuleFormData, RuleType } from '../model/types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';

const RULE_TYPE_LABELS: Record<RuleType, string> = {
    POR_MONTO: 'Por Monto Gastado',
};

const EMPTY_FORM: LoyaltyRuleFormData = {
    name: '',
    type: 'POR_MONTO',
    pointsValue: 1,
    condition: '10', // Default condition as "10" (instead of empty)
    isActive: true,
};

export function LoyaltyRules() {
    const { rules, isLoading, createRule, updateRule, toggleRule, isCreating, isUpdating } = useLoyaltyRules();
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<LoyaltyRule | null>(null);
    const [form, setForm] = useState<LoyaltyRuleFormData>(EMPTY_FORM);

    const openCreate = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEdit = (rule: LoyaltyRule) => {
        setEditTarget(rule);
        setForm({ name: rule.name, type: rule.type, pointsValue: rule.pointsValue, condition: rule.condition, isActive: rule.isActive });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (editTarget) {
            await updateRule({ id: editTarget.id, data: form });
        } else {
            await createRule(form);
        }
        setModalOpen(false);
    };

    if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">Define cómo los clientes acumulan puntos.</p>
                {rules.length === 0 && (
                    <Button size="sm" onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" /> Crear Regla Inicial
                    </Button>
                )}
            </div>

            <div className="divide-y rounded-xl border border-slate-200 bg-white overflow-hidden">
                {rules.length === 0 && (
                    <p className="text-center py-10 text-slate-400 text-sm">No hay reglas configuradas.</p>
                )}
                {rules.map(rule => (
                    <div key={rule.id} className={`flex items-center justify-between p-4 transition-colors ${rule.isActive ? 'bg-white hover:bg-slate-50' : 'bg-slate-100/80 opacity-80'}`}>
                        <div className="flex items-center gap-4">
                            <Badge
                                variant={rule.isActive ? "default" : "secondary"}
                                className={`text-[10px] uppercase font-bold tracking-wider ${rule.isActive ? 'bg-emerald-500 hover:bg-emerald-600' : 'text-slate-500 bg-slate-200'}`}
                            >
                                {rule.isActive ? 'Activa' : 'Inactiva'}
                            </Badge>
                            <div>
                                <p className="font-medium text-slate-800">{rule.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-xs">{RULE_TYPE_LABELS[rule.type]}</Badge>
                                    <span className="text-xs text-slate-500">{rule.condition}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700 mr-2">{rule.pointsValue} pts</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleRule(rule.id)} title={rule.isActive ? 'Desactivar' : 'Activar'}>
                                <Power className={`h-4 w-4 ${rule.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(rule)}>
                                <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editTarget ? 'Editar Regla' : 'Nueva Regla de Acumulación'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="rule-name">Nombre</Label>
                            <Input id="rule-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Puntos por compra" />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="rule-points">Puntos a Otorgar</Label>
                            <Input id="rule-points" type="number" min={1} value={form.pointsValue} onChange={e => setForm(f => ({ ...f, pointsValue: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="rule-cond">Monto gastado requerido ($) para generar puntos</Label>
                            <Input id="rule-cond" type="number" min={1} value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} placeholder="Ej: 10" />
                        </div>
                        <div className="flex items-center gap-3">
                            <input id="rule-active" type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
                            <Label htmlFor="rule-active">Regla activa</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={!form.name || !form.condition || isCreating || isUpdating}>
                            {isCreating || isUpdating ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
