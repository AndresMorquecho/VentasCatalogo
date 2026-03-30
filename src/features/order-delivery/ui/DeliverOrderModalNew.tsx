import { useRef, useState, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { Order } from "@/entities/order/model/types"
import type { CreditDistribution } from "@/entities/financial-record/model/types"
import { orderApi } from "@/entities/order/model/api"
import { getPaidAmount } from "@/entities/order/model/model"
import { PaymentModal, type PaymentModalData, type PaymentContext } from "@/shared/ui/PaymentModal"
import { prepareDeliveryReceiptForPreview } from "../lib/generateDeliveryReceiptWithPreview"
import { useAuth } from "@/shared/auth/AuthProvider"
import { useNotifications } from "@/shared/lib/notifications"
import { logAction } from "@/shared/lib/auditService"
import { useClientCredit } from "@/features/wallet/model/hooks"
import { usePDFPreview } from "@/shared/hooks/usePDFPreview"
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal"

interface DeliverOrderModalProps {
    order: Order | null;
    orders?: Order[];
    creditDistributions?: Record<string, CreditDistribution>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function DeliverOrderModalNew({ 
    order, 
    orders = [], 
    creditDistributions = {},
    open, 
    onOpenChange, 
    onSuccess 
}: DeliverOrderModalProps) {
    const isBatch = orders.length > 0
    const activeOrders = isBatch ? orders : (order ? [order] : [])
    const firstOrder = activeOrders[0]
    
    const isProcessingRef = useRef(false)
    const qc = useQueryClient()
    const { notifySuccess, notifyError } = useNotifications()
    const { user, hasPermission } = useAuth()
    const { data: creditData } = useClientCredit(firstOrder?.clientId || '')

    // PDF Preview state
    const [pdfTitle, setPdfTitle] = useState('')
    const [pdfFileName, setPdfFileName] = useState('')
    const pdfPreview = usePDFPreview({
        fileName: pdfFileName,
        onDownloadComplete: () => {
            notifySuccess('PDF descargado correctamente')
        },
        onError: (error) => {
            notifyError({ message: 'Error al procesar el PDF' })
            console.error('PDF Error:', error)
        }
    })

    // Calculate totals safely including distributions
    const totalAmountToCharge = useMemo(() => {
        if (activeOrders.length === 0) return 0;
        
        return activeOrders.reduce((sum, o) => {
            const initialPaid = getPaidAmount(o)
            
            // All-time distributions targeting this order in the current session
            const incomingDistributiveCredit = Object.values(creditDistributions).reduce((dSum, dist) => {
                const item = dist.distributions?.find(d => d.targetOrderId === o.id)
                return dSum + (item?.amount || 0)
            }, 0)
            
            // Precedence: Real Invoice Total > Estimated Total
            const total = o.realInvoiceTotal ?? o.total ?? 0
            const pending = Math.max(0, total - initialPaid - incomingDistributiveCredit)
            
            return sum + pending
        }, 0)
    }, [activeOrders, creditDistributions])

    const currentCreditAmount = creditData?.totalCredit || 0
 
    // Payment context for the modal
    const paymentContext: PaymentContext | null = firstOrder ? {
        type: "ABONO",
        clientId: firstOrder.clientId,
        clientName: firstOrder.clientName,
        referenceNumber: isBatch ? `LOTE-${activeOrders.length}` : firstOrder.receiptNumber,
        description: isBatch 
            ? `Entrega de lote (${activeOrders.length} pedidos)` 
            : `Entrega de pedido ${firstOrder.receiptNumber}`
    } : null

    // Keep component mounted if we are showing a PDF even if the orders are cleared
    if (!firstOrder && !pdfPreview.pdfDocument) return null

    const handlePaymentSubmit = async (data: PaymentModalData) => {
        if (!firstOrder) return;

        // VALIDA QUE TODOS LOS SALDOS A FAVOR HAYAN SIDO DISTRIBUIDOS
        const ordersWithPendingCredit = activeOrders.filter(o => {
            const initialPaid = getPaidAmount(o);
            const finalTotal = Number(o.realInvoiceTotal || o.total || 0);
            const finalBalance = finalTotal - initialPaid;
            const creditAmount = finalBalance < -0.01 ? Math.abs(finalBalance) : 0;
            
            // Si tiene crédito, DEBE tener un registro de distribución en el record
            return creditAmount > 0.01 && !creditDistributions[o.id];
        });

        if (ordersWithPendingCredit.length > 0) {
            notifyError({ message: `Distribución pendiente: ${ordersWithPendingCredit.map(o => o.receiptNumber).join(', ')}. Existen saldos a favor que deben ser distribuidos antes de finalizar la entrega.` });
            throw new Error('Pending distribution');
        }

        if (!hasPermission('delivery.confirm')) {
            notifyError({ message: 'No tienes permiso para realizar entregas' })
            throw new Error('No permission')
        }

        const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0)
        
        // REGLA FASE 3: En entregas SIEMPRE se debe pagar el total
        if (Math.abs(totalPaid - totalAmountToCharge) > 0.01) {
            notifyError({ message: 'Se debe cancelar el monto total pendiente para proceder con la entrega.' })
            throw new Error('Full payment required')
        }

        if (isProcessingRef.current) {
            throw new Error('Already processing')
        }
        
        isProcessingRef.current = true

        try {
            // Convert PaymentModal format to API format
            const paymentsToSend = data.payments.map(p => ({
                amount: p.amount,
                paymentMethod: p.method === 'BILLETERA_VIRTUAL' ? 'CREDITO_CLIENTE' : p.method,
                bankAccountId: p.bankAccountId || undefined,
                reference: p.transactionReference || undefined
            }))

            const distributionsList = Object.values(creditDistributions)
            
            console.log('[DeliverOrderModalNew] Submitting:', {
                isBatch,
                activeOrderId: firstOrder?.id,
                distributionsList: JSON.stringify(distributionsList, null, 2),
                fullCreditDistributions: JSON.stringify(creditDistributions, null, 2)
            })

            // Formatear método de pago para el PDF
            const paymentMethodString = data.payments.length > 1
                ? data.payments.map(p => `${p.method === 'BILLETERA_VIRTUAL' ? 'Billetera' : p.method}: $${p.amount.toFixed(2)}`).join(' | ')
                : (data.payments[0]?.method || 'EFECTIVO');

            if (isBatch) {
                await orderApi.batchDeliver(activeOrders.map(o => o.id), paymentsToSend, distributionsList)
                
                // RE-FETCH UPDATED ORDERS TO GET NEW BALANCES FOR PDF
                const updatedOrders = await Promise.all(
                    activeOrders.map(async (o) => {
                        return await orderApi.getById(o.id)
                    })
                )

                // PDF Preview para el lote
                try {
                    const { prepareBatchDeliveryReceiptForPreview } = await import("../lib/generateDeliveryReceiptWithPreview")
                    const { document, fileName, title } = await prepareBatchDeliveryReceiptForPreview(updatedOrders, {
                        amountPaidNow: totalPaid,
                        method: paymentMethodString,
                        user: user?.username || 'Administrador',
                        currentCreditAmount: currentCreditAmount,
                        hasCurrentCredit: currentCreditAmount > 0
                    })
                    
                    setPdfTitle(title)
                    setPdfFileName(fileName)
                    pdfPreview.openPreview(document)
                } catch (pdfError) {
                    console.error("Error preparando PDF Batch", pdfError)
                }

                notifySuccess(`Lote de ${activeOrders.length} entregas registrado correctamente`)
            } else {
                await orderApi.deliverOrder(firstOrder.id, {
                    payments: paymentsToSend,
                    notes: `Entrega al cliente ${firstOrder.clientName}`,
                    creditDistributions: distributionsList
                });

                // RE-FETCH UPDATED ORDER
                const deliveredOrder = await orderApi.getById(firstOrder.id);

                // PDF Preview - No descarga automática
                try {
                    const { document, fileName, title } = await prepareDeliveryReceiptForPreview(deliveredOrder, {
                        amountPaidNow: totalPaid,
                        method: paymentMethodString,
                        user: deliveredOrder.deliveredByName || user?.username || 'Administrador',
                        currentCreditAmount: currentCreditAmount,
                        hasCurrentCredit: currentCreditAmount > 0
                    })
                    
                    setPdfTitle(title)
                    setPdfFileName(fileName)
                    pdfPreview.openPreview(document)
                } catch (pdfError) {
                    console.error("Error preparando PDF", pdfError)
                    notifyError({ message: 'Entrega registrada pero hubo un error al generar el comprobante' })
                }

                notifySuccess('Entrega registrada correctamente')
            }

            qc.invalidateQueries({ queryKey: ['orders'] })
            qc.invalidateQueries({ queryKey: ['financial-records'] })
            qc.invalidateQueries({ queryKey: ['transactions'] })
            qc.invalidateQueries({ queryKey: ['client-rewards'] })
            qc.invalidateQueries({ queryKey: ['client-credit'] })
            qc.invalidateQueries({ queryKey: ['bank-accounts'] })

            if (user && firstOrder) {
                logAction({
                    userId: user.id,
                    userName: user.username,
                    action: 'UPDATE_ORDER',
                    module: 'orders',
                    detail: isBatch 
                        ? `Entrega lote (${activeOrders.length} pedidos). Cliente: ${firstOrder.clientName}. Total cobrado: ${totalPaid.toFixed(2)}`
                        : `Entregó pedido ${firstOrder.receiptNumber}. Cliente: ${firstOrder.clientName}. Total cobrado: ${totalPaid.toFixed(2)}`
                });
            }

            if (onSuccess) onSuccess()
        } finally {
            isProcessingRef.current = false
        }
    }

    return (
        <>
            {firstOrder && paymentContext && (
                <PaymentModal
                    open={open}
                    onOpenChange={onOpenChange}
                    onSubmit={handlePaymentSubmit}
                    paymentContext={paymentContext}
                    expectedAmount={totalAmountToCharge}
                    allowMultiplePayments={true}
                    initialAmount={totalAmountToCharge}
                    forceExactAmount={true}
                />
            )}

            {pdfPreview.pdfDocument && (
                <PDFPreviewModal
                    open={pdfPreview.isOpen}
                    onOpenChange={pdfPreview.closePreview}
                    title={pdfTitle}
                    pdfDocument={pdfPreview.pdfDocument}
                    fileName={pdfFileName}
                    onDownload={pdfPreview.downloadPDF}
                    onPrint={pdfPreview.printPDF}
                />
            )}
        </>
    )
}
