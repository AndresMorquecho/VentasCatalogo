import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Lock } from "lucide-react"

interface ConcurrencyLockDialogProps {
    isOpen: boolean;
    lockingUser: string | null;
    onClose: () => void;
    resourceName?: string;
}

export function ConcurrencyLockDialog({ isOpen, lockingUser, onClose, resourceName = "registro" }: ConcurrencyLockDialogProps) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-red-600 font-black text-xl">
                        <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-red-500" />
                        </div>
                        {resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} Bloqueado
                    </DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-6">
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Este {resourceName} está siendo editado actualmente por otro usuario para evitar conflictos de datos:
                    </p>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-monchito-purple/10 flex items-center justify-center text-monchito-purple font-black text-lg">
                            {lockingUser?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="font-black text-slate-800 text-base">{lockingUser}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">Editor en Sesión</p>
                        </div>
                    </div>
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                        <p className="text-[11px] text-amber-700 font-medium italic text-center">
                            "Solo se permite un editor a la vez. El bloqueo expirará automáticamente si el otro usuario cierra la ventana o permanece inactivo."
                        </p>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button 
                        onClick={onClose} 
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl py-6 transition-all"
                    >
                        Entendido, Volver
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
