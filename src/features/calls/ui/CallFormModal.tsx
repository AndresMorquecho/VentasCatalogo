import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { AsyncButton } from '@/shared/ui/async-button';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Phone, User, CheckCircle2, Clock, DollarSign, MoreHorizontal, ChevronLeft, Search } from 'lucide-react';

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
import { differenceInDays } from 'date-fns';
import { useDebounce } from '@/shared/lib/hooks';
import { Input } from '@/shared/ui/input';

interface CallFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    call?: Call;
    initialReason?: CallReasonValue;
    initialClient?: Client;
}

const CALL_REASONS = [
    { 
        value: 'REACTIVACION', 
        label: 'Reactivación', 
        description: 'Clientes inactivas (último pedido > 30 días)',
        icon: Clock,
        color: 'text-amber-600'
    },
    { 
        value: 'COBRO', 
        label: 'Cobranza', 
        description: 'Seguimiento de pagos pendientes',
        icon: DollarSign,
        color: 'text-red-600'
    },
    { 
        value: 'OTRO', 
        label: 'Otro', 
        description: 'Registro manual de cualquier otro tipo de llamada',
        icon: MoreHorizontal,
        color: 'text-slate-600'
    }
] as const;

type CallReasonValue = typeof CALL_REASONS[number]['value'];

export function CallFormModal({ open, onOpenChange, onSuccess, call, initialReason, initialClient }: CallFormModalProps) {
    const { mutateAsync: createCall } = useCreateCall();
    const { mutateAsync: updateCall } = useUpdateCall();
    const { notifySuccess, notifyError } = useNotifications();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'SELECT' | 'ENTRY'>('SELECT');
    const [reason, setReason] = useState<CallReasonValue>('OTRO');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [result, setResult] = useState<CallResult>('CONTESTA');
    const [notes, setNotes] = useState('');

    const [clientSearch, setClientSearch] = useState('');
    const debouncedClientSearch = useDebounce(clientSearch, 500);

    const { data: clientsResponse, isLoading: isLoadingClients } = useClientList({
        status: reason === 'REACTIVACION' ? 'INACTIVE' : undefined,
        search: debouncedClientSearch || undefined,
        limit: 100
    });

    const clients = clientsResponse?.data || [];

    useEffect(() => {
        if (open && !call) {
            setReason(initialReason || 'OTRO');
            setSelectedClient(initialClient || null);
            setResult('CONTESTA');
            setNotes('');
            setClientSearch('');
            setStep((initialReason || initialClient) ? 'ENTRY' : 'SELECT');
        } else if (open && call) {
            setStep('ENTRY');
            setReason(call.reason as CallReasonValue);
            setResult(call.result);
            setNotes(call.notes || '');
            const client = clients.find(c => c.id === call.clientId);
            if (client) setSelectedClient(client);
        }
    }, [open, call, initialReason, initialClient, clients]);

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
            } else {
                await createCall(payload);
                notifySuccess('Llamada registrada correctamente');
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


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-6">
                <DialogHeader className="shrink-0 mb-4">
                    <div className="flex items-center justify-between gap-4">
                        <DialogTitle className="flex items-center gap-2 text-monchito-purple">
                            {reason === 'OTRO' && step === 'ENTRY' && !call && (
                                <button 
                                    type="button"
                                    onClick={() => setStep('SELECT')}
                                    className="p-1 hover:bg-slate-100 rounded-full transition-colors -ml-1 mr-1"
                                >
                                    <ChevronLeft className="h-5 w-5 text-slate-500" />
                                </button>
                            )}
                            <Phone className="h-5 w-5" />
                            {call ? 'Editar Llamada' : (reason === 'OTRO' && step === 'SELECT') ? 'Seleccionar Motivo' : 'Registrar Llamada'}
                        </DialogTitle>
                        
                        {reason === 'OTRO' && step === 'ENTRY' && !call && (
                            <button 
                                type="button"
                                onClick={() => setStep('SELECT')}
                                className="text-xs font-bold text-monchito-purple bg-monchito-purple/10 px-3 py-1.5 rounded-full hover:bg-monchito-purple/20 transition-all flex items-center gap-1"
                            >
                                <ChevronLeft className="h-3 w-3" />
                                Volver
                            </button>
                        )}
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
                    {/* Reason Selection Cards (Only for Reactivation, Collections OR during Step SELECT of OTRO) */}
                    {(reason !== 'OTRO' || step === 'SELECT') && !initialClient && (
                        <div className="grid gap-2 shrink-0">
                            <Label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">1. Motivo de la llamada</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                                                if (r.value === 'OTRO') setStep('ENTRY');
                                                else setStep('SELECT');
                                            }}
                                            className={`
                                                p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3
                                                ${isSelected 
                                                    ? 'border-monchito-purple bg-monchito-purple/5 shadow-sm' 
                                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                                }
                                                ${call && !isSelected ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                        >
                                            <div className={`p-1.5 rounded-md ${isSelected ? 'bg-monchito-purple text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{r.label}</p>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 className="h-4 w-4 text-monchito-purple" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Entry Section */}
                    <div className="flex-1 flex flex-col min-h-0 gap-4">

                        {/* Step 2: Select Client */}
                        <div className="grid gap-2 flex-1 min-h-0 flex flex-col overflow-hidden">
                            <Label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 shrink-0">
                                2. Cliente
                            </Label>

                            {!selectedClient ? (
                                <>
                                    <div className="relative shrink-0">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Buscar por nombre o cédula..."
                                            className="pl-9 h-10 text-sm bg-slate-50/50 border-slate-200 focus:bg-white transition-all shadow-sm"
                                            value={clientSearch}
                                            onChange={(e) => setClientSearch(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="flex-1 min-h-[150px] overflow-auto border border-slate-200 rounded-xl bg-white shadow-inner mt-1">
                                        {isLoadingClients ? (
                                            <div className="flex items-center justify-center p-12 text-sm text-slate-400 italic">
                                                Cargando clientes...
                                            </div>
                                        ) : clients.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                                                <User className="h-10 w-10 mb-2 opacity-20" />
                                                <p className="text-sm font-medium">No se encontraron clientes</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-px bg-slate-100 p-px">
                                                {clients.map((client) => {
                                                    const lastOrder = client.lastOrderDate ? new Date(client.lastOrderDate) : null;
                                                    const daysSinceOrder = lastOrder ? differenceInDays(new Date(), lastOrder) : null;
                                                    
                                                    return (
                                                        <button
                                                            key={client.id}
                                                            type="button"
                                                            onClick={() => setSelectedClient(client)}
                                                            className="p-3 text-left transition-all bg-white hover:bg-slate-50"
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <p className="text-sm font-bold truncate text-slate-800">
                                                                            {client.firstName}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded">
                                                                            {client.identificationNumber}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400">
                                                                            {client.city}
                                                                        </span>
                                                                        {daysSinceOrder && daysSinceOrder > 0 && (
                                                                            <span className="text-[10px] text-amber-600 font-bold">
                                                                                {daysSinceOrder}d s/pedido
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="shrink-0 text-right">
                                                                    <p className="text-[10px] font-mono font-bold text-slate-500 mb-0.5">{client.phone1}</p>
                                                                    {client.lastBrandName && (
                                                                        <span className="text-[9px] text-monchito-purple font-bold bg-monchito-purple/10 px-1.5 rounded-full uppercase">
                                                                             {client.lastBrandName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="p-4 rounded-xl border-2 border-monchito-purple/20 bg-monchito-purple/5 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-monchito-purple text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                                            {selectedClient.firstName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-800">{selectedClient.firstName}</p>
                                            <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                                                {selectedClient.identificationNumber} • {selectedClient.city}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Badge variant="outline" className="text-[10px] h-4 py-0 font-medium bg-white text-slate-600 border-slate-200">
                                                    {selectedClient.phone1}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    {!initialClient && (
                                        <button 
                                            type="button"
                                            onClick={() => setSelectedClient(null)}
                                            className="text-xs font-bold text-monchito-purple bg-white px-3 py-1.5 rounded-lg border border-monchito-purple/20 hover:bg-monchito-purple hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                                        >
                                            <Search className="h-3 w-3" />
                                            Cambiar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Step 3: Call Details */}
                        {selectedClient && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-2 duration-500">
                                <div className="grid gap-3">
                                    <Label htmlFor="reason" className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between">
                                        Motivo
                                        <Badge variant="secondary" className="text-[9px] h-4 py-0 font-bold bg-monchito-purple/5 text-monchito-purple border-monchito-purple/10">Principal</Badge>
                                    </Label>
                                    <select
                                        id="reason"
                                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm focus:ring-2 focus:ring-monchito-purple focus:border-monchito-purple transition-all outline-none"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value as CallReasonValue)}
                                    >
                                        {CALL_REASONS.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-3">
                                    <Label htmlFor="result" className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between">
                                        Resultado
                                        <Badge variant="secondary" className="text-[9px] h-4 py-0 font-bold bg-emerald-50 text-emerald-600 border-emerald-100">Requerido</Badge>
                                    </Label>
                                    <select
                                        id="result"
                                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm focus:ring-2 focus:ring-monchito-purple focus:border-monchito-purple transition-all outline-none"
                                        value={result}
                                        onChange={(e) => setResult(e.target.value as CallResult)}
                                    >
                                        {CALL_RESULTS.map(r => (
                                            <option key={r} value={r}>{callResultsMap[r]}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-3">
                                    <Label htmlFor="notes" className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                                        Observaciones
                                    </Label>
                                    <textarea
                                        id="notes"
                                        rows={1}
                                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-monchito-purple focus:border-monchito-purple transition-all outline-none resize-none placeholder:text-slate-400"
                                        placeholder="Detalles..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="shrink-0 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 italic hidden md:block">
                            * Todos los registros son auditados por el sistema.
                        </p>
                        <AsyncButton 
                            type="submit" 
                            isLoading={isSubmitting} 
                            loadingText="Guardando..."
                            disabled={!selectedClient}
                            className="bg-monchito-purple hover:bg-monchito-purple/90 w-full md:w-auto shadow-md"
                        >
                            {call ? 'Guardar Cambios' : 'Finalizar Registro'}
                        </AsyncButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
