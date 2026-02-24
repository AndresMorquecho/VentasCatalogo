import { Users, Star, Award, RefreshCw } from 'lucide-react';
import { useRewards } from '@/entities/client-reward/model/hooks';
import { useLoyaltyRedemptions, useLoyaltyPrizes, useLoyaltyRules } from '../model/hooks';
import { useClients } from '@/entities/client/model/hooks';
import { Card, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

const LEVEL_STYLES: Record<string, string> = {
    PLATINO: 'bg-purple-100 text-purple-700 border-purple-200',
    ORO: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    PLATA: 'bg-slate-100 text-slate-700 border-slate-200',
    BRONCE: 'bg-orange-100 text-orange-700 border-orange-200',
};

export function LoyaltySummary() {
    const { rewards } = useRewards();
    const { redemptions } = useLoyaltyRedemptions();
    const { prizes } = useLoyaltyPrizes();
    const { rules } = useLoyaltyRules();
    const { data: clients = [] } = useClients();

    const totalPoints = rewards.reduce((acc, r) => acc + Number(r.totalRewardPoints || 0), 0);
    const totalRedemptions = redemptions.length;
    const activeRules = rules.filter(r => r.active).length;
    const activePrizes = prizes.filter(p => p.active).length;
    const topClients = [...rewards]
        .sort((a, b) => Number(b.totalRewardPoints || 0) - Number(a.totalRewardPoints || 0))
        .slice(0, 5);

    const isLoading = false;

    // Helper to get client info
    const getClientInfo = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return {
            name: client?.firstName || 'Cliente Desconocido',
            identification: client?.identificationNumber || clientId
        };
    };

    if (isLoading) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}</div>;
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-blue-50">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{rewards.length}</p>
                            <p className="text-xs text-slate-500">Clientes con puntos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-amber-50">
                            <Star className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{totalPoints.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Total puntos activos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-emerald-50">
                            <RefreshCw className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{totalRedemptions}</p>
                            <p className="text-xs text-slate-500">Canjes realizados</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-purple-50">
                            <Award className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{activeRules} / {activePrizes}</p>
                            <p className="text-xs text-slate-500">Reglas / Premios activos</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Clients Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-700 text-sm">Top 5 Clientes por Puntos</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {topClients.length === 0 ? (
                        <p className="text-center py-8 text-slate-400 text-sm">No hay datos de puntos aún.</p>
                    ) : (
                        topClients.map((reward, idx) => {
                            const clientInfo = getClientInfo(reward.clientId);
                            return (
                                <div key={reward.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
                                    <span className="text-lg font-bold text-slate-300 w-6 text-center">{idx + 1}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-700">{clientInfo.name}</p>
                                        <p className="text-xs text-slate-400">{reward.totalOrders} pedidos · ${Number(reward.totalSpent).toFixed(0)} gastado</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${LEVEL_STYLES[reward.rewardLevel] ?? 'bg-slate-100 text-slate-600'}`}>
                                            {reward.rewardLevel}
                                        </span>
                                        <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                                            <Star className="h-3.5 w-3.5" />
                                            {Number(reward.totalRewardPoints)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}