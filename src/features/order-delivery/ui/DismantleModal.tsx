import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { AlertTriangle, ShieldX, Ghost, Loader2 } from "lucide-react"
import type { Order } from "@/entities/order/model/types"
import { orderApi } from "@/entities/order/model/api"
import { useNotifications } from "@/shared/lib/notifications"

interface DismantleModalProps {
    isOpen: boolean
    onClose: () => void
    order: Order
    onSuccess: () => void
}

export function DismantleModal({ isOpen, onClose, order, onSuccess }: DismantleModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { notifySuccess, notifyError } = useNotifications()

    const handleDismantle = async (mode: 'BLOCK' | 'NORMAL') => {
        setIsSubmitting(true)
        try {
            // We'll create a new endpoint or use a generic update
            // For now, let's assume we have a dismantle endpoint in the backend
            // If not, I'll have to create it.
            await orderApi.dismantleOrder(order.id, {
                mode,
                reason: mode === 'BLOCK' ? 'Pedido no retirado por tiempo prolongado' : 'Solicitud manual del cliente'
            })
            
            notifySuccess(mode === 'BLOCK' 
                ? `Pedido desmantelado y empresaria bloqueada correctamente.` 
                : `Pedido desmantelado correctamente.`
            )
            onSuccess()
            onClose()
        } catch (error: any) {
            console.error("Error dismantling order:", error)
            notifyError(error, "Falla al desmantelar el pedido.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-amber-50 p-6 flex items-center gap-4 border-b border-amber-100">
                    <div className="bg-amber-100 p-3 rounded-xl">
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-black text-amber-900">Desmantelar Pedido</DialogTitle>
                        <DialogDescription className="text-amber-700 font-medium text-xs">
                            Esta acción es irreversible y afectará el inventario.
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/60">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Recibo</span>
                            <span className="text-slate-900 font-black font-mono">{order.receiptNumber}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Empresaria</span>
                            <span className="text-slate-900 font-black">{order.clientName}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Marca</span>
                            <span className="text-monchito-purple font-black">{order.brandName}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <button 
                            disabled={isSubmitting}
                            onClick={() => handleDismantle('BLOCK')}
                            className="flex items-start gap-4 p-4 rounded-xl border border-red-100 bg-red-50/30 hover:bg-red-50 transition-all text-left group disabled:opacity-50"
                        >
                            <div className="bg-red-100 p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                                <ShieldX className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-red-900">Modo Hostil (Bloqueo)</h4>
                                <p className="text-[10px] text-red-700/80 font-medium leading-tight mt-1">
                                    El cliente pierde el abono, el pedido se desmantela y la empresaria queda **BLOQUEADA** del sistema.
                                </p>
                            </div>
                        </button>

                        <button 
                            disabled={isSubmitting}
                            onClick={() => handleDismantle('NORMAL')}
                            className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-monchito-purple/30 hover:bg-monchito-purple/5 transition-all text-left group disabled:opacity-50"
                        >
                            <div className="bg-slate-100 p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                                <Ghost className="h-5 w-5 text-slate-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900">Modo Acordado (Simple)</h4>
                                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">
                                    Se mantiene el abono como costo, el saldo pendiente se ignora y el pedido desaparece de entregas. No hay bloqueo.
                                </p>
                            </div>
                        </button>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="font-bold text-slate-400 hover:text-slate-600">
                        Cancelar
                    </Button>
                    {isSubmitting && (
                        <div className="flex items-center gap-2 text-xs font-black text-monchito-purple animate-pulse">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Procesando...
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
