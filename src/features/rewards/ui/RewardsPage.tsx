
import { useState } from 'react';
import { useClients } from '@/entities/client/model/hooks';
import { useRewards } from '../model/hooks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Search } from 'lucide-react'; // if available
import { RewardDetailsModal } from './RewardDetailsModal';

export function RewardsPage() {
    const { data: clients } = useClients();
    const { getClientReward } = useRewards();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const filteredClients = clients?.filter(client =>
        client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.identificationNumber.includes(searchTerm)
    ) || [];

    return (
        <div className="space-y-6 container mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Fidelización de Clientes</h1>
                    <p className="text-muted-foreground">Sistema de puntos y recompensas.</p>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground absolute ml-3" />
                <Input
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Nivel</TableHead>
                            <TableHead>Puntos Totales</TableHead>
                            <TableHead>Gastado Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No se encontraron clientes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map(client => {
                                const reward = getClientReward(client.id);
                                return (
                                    <TableRow key={client.id}>
                                        <TableCell>
                                            <div className="font-medium">{client.firstName}</div>
                                            <div className="text-sm text-muted-foreground">{client.identificationNumber}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${reward.level === 'PLATINO' ? 'bg-purple-100 text-purple-700' :
                                                reward.level === 'ORO' ? 'bg-yellow-100 text-yellow-700' :
                                                    reward.level === 'PLATA' ? 'bg-gray-100 text-gray-700' :
                                                        'bg-orange-100 text-orange-700'
                                                }`}>
                                                {reward.level}
                                            </span>
                                        </TableCell>
                                        <TableCell>{reward.totalPoints} pts</TableCell>
                                        <TableCell>${reward.totalSpent.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
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
