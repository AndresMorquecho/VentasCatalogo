import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { useRewards } from '@/entities/client-reward/model/hooks';
import { Star, TrendingUp, ShoppingBag, Gift } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { useToast } from '@/shared/ui/use-toast';
import { useLoyaltyPrizes, useLoyaltyRedemptions } from '../model/hooks';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

interface RewardDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
}

export function RewardDetailsModal({ open, onOpenChange, clientId }: RewardDetailsModalProps) {
    const { getClientReward, isLoading } = useRewards();
    const { prizes } = useLoyaltyPrizes();
    const { redeemPrize, isRedeeming } = useLoyaltyRedemptions();
    const { showToast } = useToast();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedPrize, setSelectedPrize] = useState<{ id: string, name: string, points: number } | null>(null);

    const reward = getClientReward(clientId);

    const handleRedeemClick = (prize: { id: string, name: string, pointsRequired: number }) => {
        setSelectedPrize({ id: prize.id, name: prize.name, points: prize.pointsRequired });
        setConfirmOpen(true);
    };

    const handleConfirmRedeem = async () => {
        if (!selectedPrize) return;
        try {
            await redeemPrize({ clientId, prizeId: selectedPrize.id });
            showToast("Canje exitoso. Los puntos se han reiniciado.", "success");
            onOpenChange(false); // Cierra automáticamente el modal principal
        } catch (error) {
            showToast("Error al procesar el canje", "error");
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-4 bg-slate-900 text-white shrink-0">
                        <DialogTitle className="text-lg font-bold">Canjear Premios</DialogTitle>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-20 w-full rounded-xl" />
                            <Skeleton className="h-48 w-full rounded-xl" />
                        </div>
                    ) : (
                        <div className="flex flex-col h-full max-h-[85vh]">
                            {/* Summary Section - Ultra Compact */}
                            <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 bg-slate-50/50 items-center">
                                <div className="flex items-center gap-4 col-span-1 md:col-span-1">
                                    <div className="p-2 bg-white rounded-xl shadow-sm border border-amber-100 relative">
                                        <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                                        <Badge variant="outline" className="absolute -top-2 -right-2 bg-white text-[9px] px-1 h-4 font-bold border-amber-200">
                                            {reward.rewardLevel}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-slate-900 leading-none">
                                            {Number(reward.totalRewardPoints)}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Puntos Disponibles</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-around col-span-1 md:col-span-2 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                                            <ShoppingBag className="h-3.5 w-3.5 text-blue-500" />
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Pedidos</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-700">{reward.totalOrders}</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Inversión</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-700">${Number(reward.totalSpent).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Prizes List - Fixed Height with Scroll if needed */}
                            <div className="p-5 overflow-y-auto bg-white flex-1">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Gift className="h-3.5 w-3.5 text-emerald-500" />
                                    Selección de Premios
                                </h4>

                                {prizes.filter(p => p.isActive).length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-sm text-slate-400">No hay premios habilitados actualmente.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {prizes.filter(p => p.isActive).map(prize => {
                                            const canAfford = reward.totalRewardPoints >= prize.pointsRequired;

                                            return (
                                                <div
                                                    key={prize.id}
                                                    className={`relative p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${canAfford
                                                        ? 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-sm'
                                                        : 'bg-slate-50/50 border-slate-100 opacity-60'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex-1">
                                                            <p className={`text-[13px] font-bold leading-tight ${canAfford ? 'text-slate-800' : 'text-slate-500'}`}>
                                                                {prize.name}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                                                {prize.description || '🎁 Premio especial'}
                                                            </p>
                                                        </div>
                                                        <div className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded shadow-sm border ${canAfford ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                                                            }`}>
                                                            {prize.pointsRequired} PTS
                                                        </div>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        variant={canAfford ? "default" : "secondary"}
                                                        disabled={!canAfford || isRedeeming}
                                                        className={`h-7 text-[10px] font-bold uppercase tracking-wider ${canAfford ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-200 text-slate-400'
                                                            }`}
                                                        onClick={() => handleRedeemClick(prize)}
                                                    >
                                                        {canAfford ? 'Canjear' : 'Insuficiente'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={handleConfirmRedeem}
                title="Confirmar Canje"
                description={`¿Estás seguro que deseas canjear "${selectedPrize?.name}" por ${selectedPrize?.points} puntos? Esta acción reiniciará tus puntos actuales a cero.`}
                confirmText="Confirmar Canje"
                cancelText="Cancelar"
            />
        </>
    );
}
