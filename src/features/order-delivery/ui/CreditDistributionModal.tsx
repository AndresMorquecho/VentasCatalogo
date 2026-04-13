import { useState, useEffect } from "react"
import { cn } from "@/shared/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { DecimalTextField } from "@/shared/ui/DecimalTextField"
import { Checkbox } from "@/shared/ui/checkbox"
import { Label } from "@/shared/ui/label"
import { Receipt, Building2, Wallet as WalletIcon } from "lucide-react"
import type { CreditDistribution, CreditDistributionItem } from "@/entities/financial-record/model/types"
import { useQuery } from "@tanstack/react-query"
import { bankAccountApi } from "@/entities/bank-account/model/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

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
  initialDistribution?: CreditDistribution
  initialRemainingAction?: 'wallet' | 'return'
  onBack?: () => void
}

export function CreditDistributionModal({
  isOpen,
  onClose,
  sourceOrder,
  creditAmount,
  availableOrders,
  onDistribute,
  initialDistribution,
  initialRemainingAction,
  onBack
}: Props) {
  const [distributions, setDistributions] = useState<CreditDistributionItem[]>([])
  const [remainingAction, setRemainingAction] = useState<'wallet' | 'return'>(initialRemainingAction || 'wallet')
  const [selectedReturnAccountId, setSelectedReturnAccountId] = useState<string>('')

  // Fetch bank accounts for the "Return to client" option
  const { data: accountsResponse } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => bankAccountApi.getAll({ limit: 100 }),
    enabled: isOpen
  })

  // Filter out VIRTUAL accounts for refunds in this modal
  const activeAccounts = (accountsResponse?.data || []).filter(acc => 
    acc.type !== 'VIRTUAL' && 
    !acc.name.toUpperCase().includes('VIRTUAL')
  )

  // Default to first CASH account or first available
  useEffect(() => {
    if (activeAccounts.length > 0 && !selectedReturnAccountId) {
      const cashAcc = activeAccounts.find(a => a.type === 'CASH') || activeAccounts[0]
      if (cashAcc) {
        setSelectedReturnAccountId(cashAcc.id)
      }
    }
  }, [activeAccounts, selectedReturnAccountId])

  // Reset or Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialDistribution && initialDistribution.distributions.length > 0) {
        const orderDistributions = initialDistribution.distributions.filter(d => !!d.targetOrderId)
        const totalOtherDist = initialDistribution.distributions.find(d => !d.targetOrderId)
        
        setDistributions(orderDistributions)
        if (totalOtherDist) {
          setRemainingAction(totalOtherDist.isCashReturn ? 'return' : 'wallet')
          if (totalOtherDist.isCashReturn && totalOtherDist.bankAccountId) {
            setSelectedReturnAccountId(totalOtherDist.bankAccountId)
          }
        } else {
          setRemainingAction(initialRemainingAction || 'wallet')
        }
      } else {
        setDistributions([])
        setRemainingAction(initialRemainingAction || 'wallet')
      }
    }
  }, [isOpen, initialDistribution, initialRemainingAction])

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
            description: ""
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
    
    if (remaining > 0.005) {
      if (remainingAction === 'return') {
        finalDistributions.push({
          amount: remaining,
          description: "",
          isCashReturn: true,
          bankAccountId: selectedReturnAccountId || undefined
        })
      } else {
        finalDistributions.push({
          amount: remaining,
          description: ""
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
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-2 text-monchito-purple">
            <Receipt className="h-5 w-5" />
            Distribuir Saldo: ${creditAmount.toFixed(2)}
          </DialogTitle>
          <div className="space-y-1">
            <p className="text-sm text-slate-600">
              Recibo: <span className="font-mono font-bold">#{sourceOrder.receiptNumber}</span> | 
              Pedido: <span className="font-mono font-bold">#{sourceOrder.orderNumber}</span> | 
              Tipo: <span className="font-medium">{sourceOrder.orderType}</span> | 
              Cliente: <span className="font-medium">{sourceOrder.clientName}</span>
            </p>
            <p className="text-xs font-semibold text-monchito-purple">
              Selecciona pedidos y montos a aplicar
            </p>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {availableOrders.length > 0 ? (
            <div className="border rounded-lg border-slate-200 overflow-hidden flex-1 min-h-0">
              <div className="h-full overflow-y-auto">
                <div className="space-y-2 p-2">
                  {(() => {
                    const distMap = new Map();
                    for (const d of distributions) distMap.set(d.targetOrderId, d);
                    
                    return availableOrders.map(order => {
                      const distribution = distMap.get(order.id)
                      const isSelected = !!distribution
                      const distAmount = distribution?.amount || 0;
                      const newBalance = (order.pendingAmount || 0) - distAmount
                      
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
                                  <p className="text-slate-500 text-xs text-balance line-clamp-1">{order.orderNumber ? `Pedido: #${order.orderNumber}` : 'N/A'}</p>
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
                                      <DecimalTextField
                                        value={distAmount}
                                        onValueChange={(n) => handleAmountChange(order.id, n)}
                                        className="h-8 text-sm border-monchito-purple/20 px-2 w-24"
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
                    })
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg h-32 shrink-0">
              <div className="text-center text-slate-400">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay otros pedidos del mismo cliente</p>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 space-y-3 pt-3 border-t">
          <div className="border rounded-lg p-3 space-y-2 bg-slate-50">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {totalDistributed > 0 ? (
                <div className="flex justify-between">
                  <span className="text-slate-600">Distribuido a pedidos:</span>
                  <span className="font-mono font-bold text-emerald-600">${totalDistributed.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-slate-600">{totalDistributed > 0 ? 'Saldo restante:' : 'Total del saldo a favor:'}:</span>
                <span className="font-mono font-bold text-monchito-purple">${remaining.toFixed(2)}</span>
              </div>
            </div>
            
            {remaining > 0.01 ? (
              <div className="pt-2 border-t">
                <p className="text-sm text-slate-600 mb-2">
                  ¿Qué hacer con {totalDistributed > 0 ? `el restante ` : ``}${remaining.toFixed(2)}?
                </p>
                <div className="flex gap-4">
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
                    <span className="text-sm">Devolver al cliente (Reembolso)</span>
                  </label>
                </div>

                {remainingAction === 'return' && activeAccounts.length > 0 ? (
                  <div className="mt-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Desde la cuenta:</Label>
                    <Select
                      value={selectedReturnAccountId}
                      onValueChange={setSelectedReturnAccountId}
                    >
                      <SelectTrigger className="h-9 text-xs border-monchito-purple/20 bg-white min-w-[240px] focus:ring-monchito-purple/20">
                        <SelectValue placeholder="Seleccionar cuenta de origen..." />
                      </SelectTrigger>
                      <SelectContent searchable className="z-[9999]" side="top">
                        {activeAccounts.map(acc => (
                          <SelectItem 
                            key={acc.id} 
                            value={acc.id}
                            label={`${acc.name} (${acc.type === 'CASH' ? 'Efectivo' : 'Banco'})`}
                          >
                            <div className="flex flex-col gap-0.5 w-full">
                              <div className="flex items-center gap-2 font-semibold text-slate-700">
                                {acc.type === 'CASH' ? <WalletIcon className="h-3.5 w-3.5 text-emerald-600" /> : <Building2 className="h-3.5 w-3.5 text-blue-600" />}
                                <span>{acc.name}</span>
                                {acc.type !== 'CASH' ? <span className="text-[10px] text-slate-400 font-normal">({acc.type})</span> : null}
                              </div>
                              <div className="flex justify-between items-center text-[10px] pl-5 pr-1">
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                                  acc.type === 'CASH' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                                )}>
                                  {acc.type === 'CASH' ? 'Efectivo' : 'Banco'}
                                </span>
                                <span className="font-mono font-bold text-emerald-600 tracking-tight">
                                  ${Number(acc.currentBalance).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex gap-3">
            {onBack && (
              <Button variant="ghost" onClick={onBack} className="flex-1 text-slate-500 hover:text-slate-700">
                Regresar
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-monchito-purple hover:bg-monchito-purple/90"
            >
              Aplicar Distribución
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}