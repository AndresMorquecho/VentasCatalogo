import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Phone, Clock, DollarSign, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect?: (typeId: string) => void;
}

const CALL_TYPES = [
    {
        id: 'REACTIVACION',
        title: 'Reactivación',
        description: 'Llamar a clientes inactivas para reactivarlas',
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        hoverBg: 'hover:bg-amber-100',
        enabled: true
    },
    {
        id: 'COBRO',
        title: 'Cobranza',
        description: 'Seguimiento de pagos pendientes',
        icon: DollarSign,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        hoverBg: 'hover:bg-red-100',
        enabled: true
    },
    {
        id: 'OTRO',
        title: 'Otro',
        description: 'Registro manual de llamada',
        icon: MoreHorizontal,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        hoverBg: 'hover:bg-slate-100',
        enabled: true
    }
];

export function CallTypeSelectionModal({ open, onOpenChange, onSelect }: Props) {
    const navigate = useNavigate();

    const handleTypeSelect = (typeId: string) => {
        onOpenChange(false);
        if (typeId === 'REACTIVACION') {
            navigate('/calls/reactivation');
        } else if (typeId === 'COBRO') {
            navigate('/calls/collection');
        } else if (onSelect) {
            onSelect(typeId);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-monchito-purple">
                        <Phone className="h-5 w-5" />
                        Seleccionar Tipo de Seguimiento
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-2">
                        Elige el tipo de llamadas que deseas realizar
                    </p>
                </DialogHeader>

                <div className="grid gap-3 py-4">
                    {CALL_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.id}
                                onClick={() => type.enabled && handleTypeSelect(type.id)}
                                disabled={!type.enabled}
                                className={`
                                    relative p-4 rounded-lg border-2 text-left transition-all
                                    ${type.enabled 
                                        ? `${type.bgColor} ${type.borderColor} ${type.hoverBg} cursor-pointer` 
                                        : 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                                    }
                                `}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`
                                        p-3 rounded-lg shrink-0
                                        ${type.enabled ? type.bgColor : 'bg-slate-100'}
                                    `}>
                                        <Icon className={`h-6 w-6 ${type.enabled ? type.color : 'text-slate-400'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-bold text-slate-800">
                                                {type.title}
                                            </h3>
                                            {!type.enabled && (
                                                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold">
                                                    Próximamente
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600">
                                            {type.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
