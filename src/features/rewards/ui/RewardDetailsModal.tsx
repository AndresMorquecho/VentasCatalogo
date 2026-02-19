
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { RewardProgressCard } from './RewardProgressCard';
import { useRewards } from '../model/hooks';
import { useRewardHistory } from '../model/useRewardHistory';
import type { RewardType } from '@/entities/client-reward/model/types';

interface RewardDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
}

const REDEMPTION_OPTIONS: { type: RewardType, label: string, cost: number }[] = [
    { type: 'ENVIO_GRATIS', label: 'Envío Gratis', cost: 50 },
    { type: 'DESCUENTO_50', label: 'Descuento 50%', cost: 200 },
    { type: 'PRODUCTO_GRATIS', label: 'Producto Gratis', cost: 500 }
];

export function RewardDetailsModal({ open, onOpenChange, clientId }: RewardDetailsModalProps) {
    const { getClientReward, redeemPoints } = useRewards();
    const { data: history = [] } = useRewardHistory(clientId);
    const reward = getClientReward(clientId);

    const [isRedeeming, setIsRedeeming] = useState(false);

    const handleRedeem = async (type: RewardType, cost: number) => {
        setIsRedeeming(true);
        try {
            await redeemPoints(clientId, cost, type);
            // Success feedback could be added here
        } catch (error) {
            console.error(error);
            alert("No tienes suficientes puntos.");
        } finally {
            setIsRedeeming(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Detalles de Fidelización</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                    {/* Progress */}
                    <RewardProgressCard reward={reward} />

                    {/* Redeem Section */}
                    <div>
                        <h3 className="text-md font-semibold mb-3">Canjear Recompensas</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {REDEMPTION_OPTIONS.map(option => (
                                <div key={option.type} className="border rounded-lg p-3 text-center space-y-2 hover:bg-slate-50 transition-colors">
                                    <div className="font-medium text-sm">{option.label}</div>
                                    <div className="text-primary font-bold">{option.cost} pts</div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="w-full"
                                        disabled={reward.totalPoints < option.cost || isRedeeming}
                                        onClick={() => handleRedeem(option.type, option.cost)}
                                    >
                                        Canjear
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* History Section */}
                    <div>
                        <h3 className="text-md font-semibold mb-3">Historial de Canjes</h3>
                        <div className="space-y-2">
                            {history.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Sin historial de canjes.</p>
                            ) : (
                                history.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
                                        <div>
                                            <div className="font-medium">{item.rewardType.replace('_', ' ')}</div>
                                            <div className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className="text-red-500 font-semibold">
                                            -{item.pointsUsed} pts
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-auto pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
