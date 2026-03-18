import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { AsyncButton } from '@/shared/ui/async-button';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Phone, User, CheckCircle2, Clock } from 'lucide-react';

import {
    CALL_RESULTS,
    callResultsMap,
    type CallResult,
    type Call
} from '@/entities/call';
import { useClientList } from '@/features/clients/api/hooks';
import type { Client } from '@/entities/client/model/types';
import { useUpdateCall, useCreateCall } from '@/entities/call/model/hooks';
import { useNotifications } from '@/shared/lib/notifications';
import { useAuth } from '@/shared/auth';
import { logAction } from '@/shared/lib/auditService';
import { differenceInDays } from 'date-fns';

interface CallFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    call?: Call;
}

// Motivos de llamada con sus filtros de clientes
const CALL_REASONS = [
    { 
        value: 'REACTIVACION', 
        label: 'Reactivación', 
        description: 'Clientes inactivas (último pedido > 30 días)',
        icon: Clock,
        color: 'text-amber-600'
    }
] as const;

type CallReasonValue = typeof CALL_REASONS[number]['value'];

export function CallFormModal({ open, onOpenChange, onSuccess, call }: CallFormModalProps) {
    const { mutateAsync: createCall } = useCreateCall();
    const { mutateAsync: updateCall } = useUpdateCall();
    const { notifySuccess, notifyError } = useNotifications();
    const { user } = useAuth();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reason, setReason] = useState<CallReasonValue>('REACTIVACION');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [result, setResult] = useState<CallResult>('NO_CONTESTA');
    const [notes, setNotes] = useState('');

    // Fetch clients based on selected reason
    const { data: clientsResponse, isLoading: isLoadingClients } = useClientList({
        status: reason === 'REACTIVACION' ? 'INACTIVE' : undefined,
        limit: 100
    });

    const clients = clientsResponse?.data || [];

    // Reset form when modal opens/closes
    useEffect(() => {
        if (open && !call) {
            setReason('REACTIVACION');
            setSelectedClient(null);
            setResult('NO_CONTESTA');
            setNotes('');
        } else if (open && call) {
            // Edit mode - load call data
            setReason(call.reason as CallReasonValue);
            setResult(call.result);
            setNotes(call.notes || '');
            // Find client from the list
            const client = clients.find(c => c.id === call.clientId);
            if (client) setSelectedClient(client);
        }
    }, [open, call, clients]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) {
            notifyError({ message: 'Debe seleccionar una cliente' });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                clientId: selectedClient.id,
                reason,
                result,
                notes: notes || null
            };

            if (call) {
                await updateCall({ id: call.id, data: payload });
                notifySuccess('Llamada actualizada correctamente');
                if (user) {
                    logAction({
                        userId: user.id,
                        userName: user.username,
                        action: 'UPDATE_USER',
                        module: 'calls' as any,
                        detail: `Editó registro de llamada para ${selectedClient.firstName}`
                    });
                }
            } else {
                await createCall(payload);
                notifySuccess('Llamada registrada correctamente');
                if (user) {
                    logAction({
                        userId: user.id,
                        userName: user.username,
                        action: 'CREATE_USER',
                        module: 'calls' as any,
                        detail: `Registró llamada de ${CALL_REASONS.find(r => r.value === reason)?.label} para ${selectedClient.firstName}`
                    });
                }
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error('Error saving call', error);
            notifyError(error, 'Error al registrar la llamada');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedReasonConfig = CALL_REASONS.find(r => r.value === reason);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-monchito-purple">
                        <Phone className="h-5 w-5" />
                        {call ? 'Editar Llamada' : 'Registrar Nueva Llamada'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col gap-4 py-4">
                    {/* Step 1: Select Reason */}
                    <div className="grid gap-2 shrink-0">
                        <Label className="text-xs font-medium text-slate-600">1. Motivo de la llamada</Label>
                        <div className="grid gap-2">
                            {CALL_REASONS.map((r) => {
                                const Icon = r.icon;
                                const isSelected = reason === r.value;
                                return (
                                    <button
                                        key={r.value}
                                        type="button"
                                        disabled={!!call}
                                        onClick={() => {
                                            setReason(r.value);
                                            setSelectedClient(null);
                                        }}
                                        className={`
                                            p-3 rounded-lg border-2 text-left transition-all
                                            ${isSelected 
                                                ? 'border-monchito-purple bg-monchito-purple/5' 
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }
                                            ${call ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-monchito-purple' : r.color}`} />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800">{r.label}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 className="h-5 w-5 text-monchito-purple" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Select Client */}
                    <div className="grid gap-2 flex-1 min-h-0 flex flex-col">
                        <Label className="text-xs font-medium text-slate-600 shrink-0">
                            2. Seleccionar cliente ({clients.length} disponibles)
                        </Label>
                        
                        {isLoadingClients ? (
                            <div className="flex items-center justify-center p-8 text-sm text-slate-500">
                                Cargando clientes...
                            </div>
                        ) : clients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <User className="h-12 w-12 text-slate-300 mb-2" />
                                <p className="text-sm font-medium text-slate-500">No hay clientes disponibles</p>
                                <p className="text-xs text-slate-400 mt-1">{selectedReasonConfig?.description}</p>
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0 overflow-auto border rounded-lg">
                                <div className="grid gap-1 p-2">
                                    {clients.map((client) => {
                                        const isSelected = selectedClient?.id === client.id;
                                        const lastOrder = client.lastOrderDate ? new Date(client.lastOrderDate) : null;
                                        const daysSinceOrder = lastOrder ? differenceInDays(new Date(), lastOrder) : null;
                                        
                                        return (
                                            <button
                                                key={client.id}
                                                type="button"
                                                onClick={() => setSelectedClient(client)}
                                                className={`
                                                    p-3 rounded-lg text-left transition-all border
                                                    ${isSelected 
                                                        ? 'border-monchito-purple bg-monchito-purple/5' 
                                                        : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-sm font-bold text-slate-800 truncate">
                                                                {client.firstName}
                                                            </p>
                                                            {isSelected && (
                                                                <CheckCircle2 className="h-4 w-4 text-monchito-purple shrink-0" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-mono text-slate-500">
                                                                {client.identificationNumber}
                                                            </span>
                                                            <span className="text-xs text-slate-400">•</span>
                                                            <span className="text-xs text-slate-500">
                                                                {client.city}
                                                            </span>
                                                            {daysSinceOrder && (
                                                                <>
                                                                    <span className="text-xs text-slate-400">•</span>
                                                                    <span className="text-xs text-amber-600 font-medium">
                                                                        {daysSinceOrder} días sin pedido
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {client.lastBrandName && (
                                                            <p className="text-xs text-monchito-purple font-semibold mt-1">
                                                                Último catálogo: {client.lastBrandName}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="shrink-0">
                                                        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                                                            {client.phone1}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Result and Notes */}
                    {selectedClient && (
                        <div className="grid gap-4 shrink-0 pt-4 border-t">
                            <div className="grid gap-2">
                                <Label htmlFor="result" className="text-xs font-medium text-slate-600">
                                    3. Resultado de la llamada
                                </Label>
                                <select
                                    id="result"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-monchito-purple focus-visible:ring-offset-2"
                                    value={result}
                                    onChange={(e) => setResult(e.target.value as CallResult)}
                                >
                                    {CALL_RESULTS.map(r => (
                                        <option key={r} value={r}>{callResultsMap[r]}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes" className="text-xs font-medium text-slate-600">
                                    Observaciones
                                </Label>
                                <textarea
                                    id="notes"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-monchito-purple focus-visible:ring-offset-2"
                                    placeholder="Detalles de la llamada..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="shrink-0">
                        <AsyncButton 
                            type="submit" 
                            isLoading={isSubmitting} 
                            loadingText="Guardando..."
                            disabled={!selectedClient}
                            className="bg-monchito-purple hover:bg-monchito-purple/90"
                        >
                            {call ? 'Guardar Cambios' : 'Registrar Llamada'}
                        </AsyncButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
