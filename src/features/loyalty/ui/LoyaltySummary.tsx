import { useState } from 'react';
import { Users, Star, Award, RefreshCw, Search } from 'lucide-react';
import { useRewards } from '@/entities/client-reward/model/hooks';
import { useLoyaltyRedemptions, useLoyaltyPrizes, useLoyaltyRules } from '../model/hooks';
import { useClients } from '@/entities/client/model/hooks';
import { Card, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { RewardDetailsModal } from './RewardDetailsModal';
import { LoyaltyPointHistoryModal } from './LoyaltyPointHistoryModal';

const LEVEL_STYLES: Record<string, string> = {
    PLATINO: 'bg-purple-100 text-purple-700 border-purple-200',
    ORO: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    PLATA: 'bg-slate-100 text-slate-700 border-slate-200',
    BRONCE: 'bg-orange-100 text-orange-700 border-orange-200',
};

export function LoyaltySummary() {
    const { rewards, isLoading: rewardsLoading } = useRewards();
    const { redemptions, isLoading: redemptionsLoading } = useLoyaltyRedemptions();
    const { prizes, isLoading: prizesLoading } = useLoyaltyPrizes();
    const { rules, isLoading: rulesLoading } = useLoyaltyRules();
    const { data: clients = [], isLoading: clientsLoading } = useClients();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [historyClientId, setHistoryClientId] = useState<string | null>(null);

    const isLoading = rewardsLoading || redemptionsLoading || prizesLoading || rulesLoading || clientsLoading;

    const totalPoints = rewards.reduce((acc, r) => acc + Number(r.totalRewardPoints || 0), 0);
    const totalRedemptions = redemptions.length;
    const activeRules = rules.filter(r => r.isActive).length;
    const activePrizes = prizes.filter(p => p.isActive).length;

    const filteredClients = clients?.filter(client =>
        client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.identificationNumber.includes(searchTerm)
    ) || [];

    const sortedClients = [...filteredClients].sort((a, b) => {
        const rewardA = rewards.find(r => r.clientId === a.id);
        const rewardB = rewards.find(r => r.clientId === b.id);
        return Number(rewardB?.totalRewardPoints || 0) - Number(rewardA?.totalRewardPoints || 0);
    });

    const getClientName = (id: string) => clients.find(c => c.id === id)?.firstName || '';

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        );
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

            {/* Clients Table (Unified View) */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <h3 className="font-bold text-slate-800 text-lg">Saldo y Estado de Clientes</h3>
                    <div className="relative w-full md:w-64">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                        <Input
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-12 text-center">#</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead className="text-center">Nivel</TableHead>
                                <TableHead className="text-center">Puntos Totales</TableHead>
                                <TableHead className="text-center">Gastado Total</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                                        No se encontraron clientes.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedClients.map((client, idx) => {
                                    const reward = rewards.find(r => r.clientId === client.id) || {
                                        totalRewardPoints: 0,
                                        totalSpent: 0,
                                        rewardLevel: 'BRONCE'
                                    };
                                    return (
                                        <TableRow key={client.id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="text-center text-slate-400 font-bold">{idx + 1}</TableCell>
                                            <TableCell>
                                                <div className="font-medium text-slate-800">{client.firstName}</div>
                                                <div className="text-xs text-slate-400">{client.identificationNumber}</div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${LEVEL_STYLES[reward.rewardLevel] ?? 'bg-slate-100 text-slate-600'}`}>
                                                    {reward.rewardLevel}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="flex items-center justify-center gap-1 font-bold text-amber-600">
                                                    <Star className="h-3.5 w-3.5" />
                                                    {Number(reward.totalRewardPoints)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center text-slate-600 font-medium">
                                                ${Number(reward.totalSpent).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold"
                                                        onClick={() => setSelectedClientId(client.id)}
                                                    >
                                                        Reclamar
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => setHistoryClientId(client.id)}
                                                    >
                                                        Historial
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {selectedClientId && (
                <RewardDetailsModal
                    open={!!selectedClientId}
                    onOpenChange={(open) => !open && setSelectedClientId(null)}
                    clientId={selectedClientId}
                />
            )}

            {historyClientId && (
                <LoyaltyPointHistoryModal
                    open={!!historyClientId}
                    onOpenChange={(open) => !open && setHistoryClientId(null)}
                    clientId={historyClientId}
                    clientName={getClientName(historyClientId)}
                />
            )}
        </div>
    );
}