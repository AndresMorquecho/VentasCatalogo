import { useState } from 'react';
import { useClients } from '@/entities/client/model/hooks';
import { useRewards } from '@/entities/client-reward/model/hooks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Search } from 'lucide-react';
import { RewardDetailsModal } from './RewardDetailsModal';

const LEVEL_STYLES: Record<string, string> = {
    PLATINO: 'bg-purple-100 text-purple-700 border-purple-200',
    ORO: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    PLATA: 'bg-slate-100 text-slate-700 border-slate-200',
    BRONCE: 'bg-orange-100 text-orange-700 border-orange-200',
};

export function LoyaltyClientStatus() {
    const { data: clients } = useClients();
    const { getClientReward } = useRewards();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const filteredClients = clients?.filter(client =>
        client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.identificationNumber.includes(searchTerm)
    ) || [];

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <p className="text-sm text-slate-500">Maneja los saldos de puntos y niveles de lealtad de tus clientes.</p>
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
                            <TableHead>Cliente</TableHead>
                            <TableHead>Nivel</TableHead>
                            <TableHead className="text-center">Puntos Totales</TableHead>
                            <TableHead className="text-center">Gastado Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                                    No se encontraron clientes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map(client => {
                                const reward = getClientReward(client.id);
                                return (
                                    <TableRow key={client.id} className="hover:bg-slate-50">
                                        <TableCell>
                                            <div className="font-medium text-slate-800">{client.firstName}</div>
                                            <div className="text-xs text-slate-400">{client.identificationNumber}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${LEVEL_STYLES[reward.rewardLevel] ?? 'bg-slate-100 text-slate-600'}`}>
                                                {reward.rewardLevel}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-amber-600">{Number(reward.totalRewardPoints)} pts</TableCell>
                                        <TableCell className="text-center text-slate-600">${Number(reward.totalSpent).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => setSelectedClientId(client.id)}
                                            >
                                                Ver Detalle
                                            </Button>
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
        </div>
    );
}
