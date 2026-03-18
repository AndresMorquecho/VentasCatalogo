import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Checkbox } from "@/shared/ui/checkbox"
import { Receipt, ArrowRight } from "lucide-react"
import type { CreditDistribution, CreditDistributionItem } from "@/entities/financial-record/model/types"

interface Props {
  isOpen: boolean
  onClose: () => void
  sourceOrder: {
    id: string
    receiptNumber: string
    orderNumber: string
    clientId: string
    clientName: string
    orderType: string
  }
  creditAmount: number
  availableOrders: Array<{
    id: string
    receiptNumber: string
    orderNumber: string
    clientName: string
    orderType: string
    pendingAmount: number
    totalAmount?: number
    paidAmount?: number
    brandName?: string
  }>
  onDistribute: (distribution: CreditDistribution) => void
}

export function CreditDistributionModal({
  isOpen,
  onClose,
  sourceOrder,
  creditAmount,
  availableOrders,
  onDistribute
}: Props) {
  const [distributions, setDistributions] = useState<CreditDistributionItem[]>([])
  const [remainingAction, setRemainingAction] = useState<'wallet' | 'return'>('wallet')

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setDistributions([])
      setRemainingAction('wallet')
    }
  }, [isOpen, creditAmount])

  const totalDistributed = distributions.reduce((sum, d) => sum + d.amount, 0)
  const remaining = creditAmount - totalDistributed

  const handleOrderToggle = (orderId: string, checked: boolean) => {
    if (checked) {
      const order = availableOrders.find(o => o.id === orderId)
      if (order) {
        const maxAmount = Math.min(remaining, order.pendingAmount)
        if (maxAmount > 0) {
          const newDistribution: CreditDistributionItem = {
            targetOrderId: orderId,
            amount: maxAmount,
            description: `Aplicación de saldo a favor - Origen: Pedido ${sourceOrder.receiptNumber}, Destino: Pedido ${order.receiptNumber}`
          }
          setDistributions(prev => [...prev, newDistribution])
        }
      }
    } else {
      setDistributions(prev => prev.filter(d => d.targetOrderId !== orderId))
    }
  }

  const handleAmountChange = (orderId: string, newAmount: number) => {
    const order = availableOrders.find(o => o.id === orderId)
    if (!order) return

    const currentDist = distributions.find(d => d.targetOrderId === orderId)
    if (!currentDist) return

    const otherDistributions = distributions.filter(d => d.targetOrderId !== orderId).reduce((sum, d) => sum + d.amount, 0)
    const maxAvailable = creditAmount - otherDistributions
    const maxAmount = Math.min(order.pendingAmount, maxAvailable)
    const validAmount = Math.max(0, Math.min(newAmount, maxAmount))
    
    setDistributions(prev => 
      prev.map(d => 
        d.targetOrderId === orderId 
          ? { ...d, amount: validAmount }
          : d
      )
    )
  }

  const handleConfirm = () => {
    const finalDistributions: CreditDistributionItem[] = [...distributions]
    
    // Add remaining amount distribution based on user choice
    if (remaining > 0) {
      if (remainingAction === 'return') {
        finalDistributions.push({
          amount: remaining,
          description: `Devolución en efectivo - Origen: Pedido ${sourceOrder.receiptNumber}`,
          isCashReturn: true
        })
      } else {
        finalDistributions.push({
          amount: remaining,
          description: `Saldo restante guardado en billetera virtual - Origen: Pedido ${sourceOrder.receiptNumber}`
        })
      }
    }

    const distribution: CreditDistribution = {
      sourceOrderId: sourceOrder.id,
      totalCreditAmount: creditAmount,
      distributions: finalDistributions
    }

    onDistribute(distribution)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-monchito-purple">
            <Receipt className="h-5 w-5" />
            Distribuir Saldo: ${creditAmount.toFixed(2)}
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Recibo: <span className="font-mono font-bold">#{sourceOrder.receiptNumber}</span> | 
            Pedido: <span className="font-mono font-bold">#{sourceOrder.orderNumber}</span> | 
            Tipo: <span className="font-medium">{sourceOrder.orderType}</span>
            <br />
            Cliente: <span className="font-medium">{sourceOrder.clientName}</span>
          </p>
        </DialogHeader>

        {/* Distribution Section */}
        <div className="flex-1 min-h-0 space-y-4">
          <div>
            <Label className="text-sm font-bold text-monchito-purple">
              Selecciona pedidos y montos a aplicar
            </Label>
          </div>

          {availableOrders.length > 0 ? (
            <div className="border rounded-lg border-slate-200 overflow-hidden">
              <div className="h-48 overflow-y-auto">
                <div className="space-y-2 p-2">
                  {availableOrders.map(order => {
                    const distribution = distributions.find(d => d.targetOrderId === order.id)
                    const isSelected = !!distribution
                    const newBalance = (order.pendingAmount || 0) - (distribution?.amount || 0)
                    
                    return (
                      <div key={order.id} className={`border rounded-lg transition-colors ${
                        isSelected ? 'bg-monchito-purple/5 border-monchito-purple/20' : 'bg-white border-slate-200'
                      }`}>
                        <div className="px-3 py-2">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleOrderToggle(order.id, !!checked)}
                            />
                            <div className="flex-1 grid grid-cols-5 gap-3 items-center text-sm">
                              <div>
                                <p className="font-mono font-semibold text-monchito-purple text-sm">#{order.receiptNumber}</p>
                                <p className="text-slate-500 text-xs">Pedido: #{order.orderNumber || 'N/A'}</p>
                                <p className="text-slate-500 text-xs">{order.orderType || 'NORMAL'}</p>
                                <p className="text-slate-500 text-xs">{order.brandName || 'Sin catálogo'}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-slate-500 text-xs font-medium">Total</p>
                                <p className="font-mono font-semibold text-sm">${(order.totalAmount || 0).toFixed(2)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-slate-500 text-xs font-medium">Pendiente</p>
                                <p className="font-mono font-semibold text-amber-600 text-sm">${order.pendingAmount.toFixed(2)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-slate-500 text-xs font-medium">Nuevo saldo</p>
                                <p className={`font-mono font-semibold text-sm ${newBalance <= 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  ${newBalance.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 justify-end">
                                {isSelected ? (
                                  <>
                                    <span className="text-slate-600 text-sm font-medium">$</span>
                                    <Input
                                      type="number"
                                      value={distribution.amount}
                                      onChange={(e) => handleAmountChange(order.id, Number(e.target.value))}
                                      className="h-8 text-sm border-monchito-purple/20 focus:ring-monchito-purple/20 px-2 w-24"
                                      min={0}
                                      max={Math.min(order.pendingAmount, remaining + distribution.amount)}
                                      step={0.01}
                                    />
                                  </>
                                ) : (
                                  <div className="h-8 w-24"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl h-32">
              <div className="text-center text-slate-400">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay otros pedidos del mismo cliente</p>
              </div>
            </div>
          )}

          {/* Summary when there are distributions */}
          {totalDistributed > 0 && (
            <div className="shrink-0 border rounded-lg p-3 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Distribuido a pedidos:</span>
                <span className="font-mono font-bold">${totalDistributed.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Saldo restante:</span>
                <span className="font-mono font-bold text-monchito-purple">${remaining.toFixed(2)}</span>
              </div>
              
              {remaining > 0.01 && (
                <div className="pt-2 border-t space-y-2">
                  <p className="text-sm text-slate-600 mb-2">
                    ¿Qué hacer con el restante ${remaining.toFixed(2)}?
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="remainingAction"
                        value="wallet"
                        checked={remainingAction === 'wallet'}
                        onChange={(e) => setRemainingAction(e.target.value as 'wallet' | 'return')}
                        className="text-monchito-purple focus:ring-monchito-purple"
                      />
                      <span className="text-sm">Guardar en billetera virtual</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="remainingAction"
                        value="return"
                        checked={remainingAction === 'return'}
                        onChange={(e) => setRemainingAction(e.target.value as 'wallet' | 'return')}
                        className="text-monchito-purple focus:ring-monchito-purple"
                      />
                      <span className="text-sm">Devolver al cliente (efectivo)</span>
                    </label>
                  </div>
                </div>
              )}

              <Button
                onClick={handleConfirm}
                className="w-full bg-monchito-purple hover:bg-monchito-purple/90"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Aplicar Distribución
              </Button>
            </div>
          )}
        </div>

        {/* Cancel Action */}
        <div className="shrink-0">
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}