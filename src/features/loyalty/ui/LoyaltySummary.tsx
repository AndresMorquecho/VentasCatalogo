import { useState } from 'react';
import { Star } from 'lucide-react';
import { useRewards } from '@/entities/client-reward/model/hooks';
import { useClients } from '@/entities/client/model/hooks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { RewardDetailsModal } from './RewardDetailsModal';
import { LoyaltyPointHistoryModal } from './LoyaltyPointHistoryModal';

const LEVEL_STYLES: Record<string, string> = {
    PLATINO: 'bg-[#570d64]/10 text-[#570d64] border-[#570d64]/20',
    ORO: 'bg-[#f0cd23]/10 text-[#570d64] border-[#f0cd23]/20',
    PLATA: 'bg-slate-100 text-slate-700 border-slate-200',
    BRONCE: 'bg-orange-100 text-orange-700 border-orange-200',
};

interface LoyaltySummaryProps {
    searchTerm: string;
}

export function LoyaltySummary({ searchTerm }: LoyaltySummaryProps) {
    const { rewards, isLoading: rewardsLoading } = useRewards();
    const { data: clients = [], isLoading: clientsLoading } = useClients();
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [historyClientId, setHistoryClientId] = useState<string | null>(null);

    const isLoading = rewardsLoading || clientsLoading;

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
                <div className="h-64 w-full bg-slate-50 animate-pulse rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
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
                                                    className="h-8 text-[#20a29a] hover:text-[#1b8c85] hover:bg-[#20a29a]/10 font-bold"
                                                    onClick={() => setSelectedClientId(client.id)}
                                                >
                                                    Reclamar
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-[#570d64] hover:text-[#4a0a55] hover:bg-[#570d64]/10"
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
