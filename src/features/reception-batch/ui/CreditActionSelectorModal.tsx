import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { DollarSign, Wallet, HandCoins, Receipt } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  sourceOrder: {
    id: string
    receiptNumber: string
    orderNumber: string
    clientName: string
    orderType: string
  }
  creditAmount: number
  onMoveToWallet: () => void
  onReturnToClient: () => void
  onDistributeToOrders: () => void
}

export function CreditActionSelectorModal({
  isOpen,
  onClose,
  sourceOrder,
  creditAmount,
  onMoveToWallet,
  onReturnToClient,
  onDistributeToOrders
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-monchito-purple">
            <DollarSign className="h-5 w-5" />
            Saldo a Favor: ${creditAmount.toFixed(2)}
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Recibo: <span className="font-mono font-bold">#{sourceOrder.receiptNumber}</span> | 
            Pedido: <span className="font-mono font-bold">#{sourceOrder.orderNumber}</span> | 
            Tipo: <span className="font-medium">{sourceOrder.orderType}</span>
            <br />
            Cliente: <span className="font-medium">{sourceOrder.clientName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-center text-slate-700 font-medium">
            ¿Qué quieres hacer con este saldo?
          </p>

          <div className="space-y-3">
            <Button
              onClick={onMoveToWallet}
              className="w-full h-12 bg-monchito-purple hover:bg-monchito-purple/90 text-white justify-start text-left"
            >
              <Wallet className="h-5 w-5 mr-3" />
              <div>
                <div className="font-medium">Mover a Billetera Virtual</div>
                <div className="text-xs opacity-90">Disponible para futuros pedidos</div>
              </div>
            </Button>

            <Button
              onClick={onReturnToClient}
              variant="outline"
              className="w-full h-12 border-monchito-purple/20 text-monchito-purple hover:bg-monchito-purple/5 justify-start text-left"
            >
              <HandCoins className="h-5 w-5 mr-3" />
              <div>
                <div className="font-medium">Devolver al Cliente</div>
                <div className="text-xs opacity-70">Salida de caja registrada</div>
              </div>
            </Button>

            <Button
              onClick={onDistributeToOrders}
              variant="outline"
              className="w-full h-12 border-monchito-purple/20 text-monchito-purple hover:bg-monchito-purple/5 justify-start text-left"
            >
              <Receipt className="h-5 w-5 mr-3" />
              <div>
                <div className="font-medium">Distribuir entre Pedidos</div>
                <div className="text-xs opacity-70">Aplicar a otros pedidos del cliente</div>
              </div>
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}