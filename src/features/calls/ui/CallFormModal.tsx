import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { AsyncButton } from '@/shared/ui/async-button';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';

import {
    CALL_REASONS,
    CALL_RESULTS,
    callReasonsMap,
    callResultsMap,
    type CallReason,
    type CallResult
} from '@/entities/call';
import { useClients } from '@/entities/client/model/hooks';
import type { Client } from '@/entities/client/model/types';
import { useCalls } from '../model/hooks';

interface CallFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CallFormModal({ open, onOpenChange, onSuccess }: CallFormModalProps) {
    const { addCall } = useCalls();
    const { data: clients } = useClients();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [clientId, setClientId] = useState('');
    const [reason, setReason] = useState<CallReason>('SEGUIMIENTO_PEDIDO');
    const [result, setResult] = useState<CallResult>('NO_CONTESTA');
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const filteredClients = clients?.filter(c =>
        c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.identificationNumber.includes(searchTerm)
    ).slice(0, 5) || [];

    const handleClientSelect = (client: Client) => {
        setClientId(client.id);
        setSearchTerm(`${client.firstName} (${client.identificationNumber})`);
        setIsSearching(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) return;

        setIsSubmitting(true);
        try {
            await addCall({
                clientId,
                reason,
                result,
                notes
            });

            onOpenChange(false);
            onSuccess?.();
            // Reset
            setClientId('');
            setSearchTerm('');
            setNotes('');
        } catch (error) {
            console.error("Error saving call", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Registrar Nueva Llamada</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="client">Cliente</Label>
                        <div className="relative">
                            <Input
                                id="client"
                                placeholder="Buscar por nombre o cédula..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setIsSearching(true);
                                    if (clientId && e.target.value === '') setClientId('');
                                }}
                                onFocus={() => setIsSearching(true)}
                                autoComplete="off"
                            />
                            {isSearching && searchTerm && (
                                <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-auto">
                                    {filteredClients.map(client => (
                                        <div
                                            key={client.id}
                                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                            onClick={() => handleClientSelect(client)}
                                        >
                                            {client.firstName} - {client.identificationNumber}
                                        </div>
                                    ))}
                                    {filteredClients.length === 0 && (
                                        <div className="p-2 text-gray-500 text-sm">No se encontraron clientes</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="reason">Motivo</Label>
                            <select
                                id="reason"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={reason}
                                onChange={(e) => setReason(e.target.value as CallReason)}
                            >
                                {CALL_REASONS.map(r => (
                                    <option key={r} value={r}>{callReasonsMap[r]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="result">Resultado</Label>
                            <select
                                id="result"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={result}
                                onChange={(e) => setResult(e.target.value as CallResult)}
                            >
                                {CALL_RESULTS.map(r => (
                                    <option key={r} value={r}>{callResultsMap[r]}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Observaciones</Label>
                        <textarea
                            id="notes"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Detalles de la llamada..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <AsyncButton type="submit" isLoading={isSubmitting} loadingText="Guardando...">
                            Guardar Llamada
                        </AsyncButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
