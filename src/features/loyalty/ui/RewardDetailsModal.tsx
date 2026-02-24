import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { useRewards } from '@/entities/client-reward/model/hooks';
import { Star, TrendingUp, ShoppingBag, Calendar } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Badge } from '@/shared/ui/badge';

interface RewardDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
}

export function RewardDetailsModal({ open, onOpenChange, clientId }: RewardDetailsModalProps) {
    const { getClientReward, isLoading } = useRewards();
    const reward = getClientReward(clientId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Detalle de Fidelización</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="space-y-4 py-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Summary Card */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col items-center text-center gap-2">
                            <div className="p-3 bg-white rounded-full shadow-sm border border-amber-100">
                                <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-slate-800">{Number(reward.totalRewardPoints)}</h3>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Puntos Disponibles</p>
                            </div>
                            <Badge className={`mt-2 ${reward.rewardLevel === 'PLATINO' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                reward.rewardLevel === 'ORO' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                    reward.rewardLevel === 'PLATA' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                                        'bg-orange-100 text-orange-700 border-orange-200'
                                }`}>
                                NIVEL {reward.rewardLevel}
                            </Badge>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-slate-100 bg-white">
                                <div className="flex items-center gap-2 text-slate-500 mb-1">
                                    <ShoppingBag className="h-4 w-4" />
                                    <span className="text-xs font-semibold">Pedidos</span>
                                </div>
                                <p className="text-xl font-bold text-slate-800">{reward.totalOrders}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-100 bg-white">
                                <div className="flex items-center gap-2 text-slate-500 mb-1">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-xs font-semibold">Inversión</span>
                                </div>
                                <p className="text-xl font-bold text-slate-800">${Number(reward.totalSpent).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Última actualización: {new Date(reward.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
