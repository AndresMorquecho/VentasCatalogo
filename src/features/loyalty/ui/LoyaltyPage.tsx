import { Award, Users, Star, RefreshCw } from 'lucide-react';
import { LoyaltyTabs } from './LoyaltyTabs';
import { PageHeader } from "@/shared/ui/PageHeader";
import { useRewards } from '@/entities/client-reward/model/hooks';
import { useLoyaltyRedemptions, useLoyaltyPrizes, useLoyaltyRules } from '../model/hooks';
import { Card, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

export function LoyaltyPage() {
    const { rewards, isLoading: rewardsLoading } = useRewards();
    const { redemptions, isLoading: redemptionsLoading } = useLoyaltyRedemptions();
    const { prizes, isLoading: prizesLoading } = useLoyaltyPrizes();
    const { rules, isLoading: rulesLoading } = useLoyaltyRules();

    const isLoading = rewardsLoading || redemptionsLoading || prizesLoading || rulesLoading;

    const totalPoints = rewards.reduce((acc, r) => acc + Number(r.totalRewardPoints || 0), 0);
    const totalRedemptions = redemptions.length;
    const activeRules = rules.filter(r => r.isActive).length;
    const activePrizes = prizes.filter(p => p.isActive).length;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Programa de Fidelización"
                description="Gestiona puntos, recompensas y niveles de tus clientes VIP."
                icon={Award}
            />

            {/* KPI Cards (Global Summary) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)
                ) : (
                    <>
                        <Card className="border-slate-100 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-2.5 rounded-lg bg-[#570d64]/10">
                                    <Users className="h-5 w-5 text-[#570d64]" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{rewards.length}</p>
                                    <p className="text-xs text-slate-500">Clientes con puntos</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-100 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-2.5 rounded-lg bg-[#f0cd23]/10">
                                    <Star className="h-5 w-5 text-[#f0cd23]" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{totalPoints.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">Total puntos activos</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-100 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-2.5 rounded-lg bg-[#20a29a]/10">
                                    <RefreshCw className="h-5 w-5 text-[#20a29a]" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{totalRedemptions}</p>
                                    <p className="text-xs text-slate-500">Canjes realizados</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-100 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-2.5 rounded-lg bg-[#570d64]/10">
                                    <Award className="h-5 w-5 text-[#570d64]" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{activeRules} / {activePrizes}</p>
                                    <p className="text-xs text-slate-500">Reglas / Premios activos</p>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Tabs Module */}
            <LoyaltyTabs />
        </div>
    );
}
