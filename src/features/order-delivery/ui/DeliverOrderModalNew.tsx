import { useRef, useState, useMemo, useEffect, type ReactElement } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { Order } from "@/entities/order/model/types"
import type { CreditDistribution } from "@/entities/financial-record/model/types"
import { orderApi } from "@/entities/order/model/api"
import { getPaidAmount } from "@/entities/order/model/model"
import { PaymentModal, type PaymentModalData, type PaymentContext } from "@/shared/ui/PaymentModal"
import { useAuth } from "@/shared/auth/AuthProvider"
import { useNotifications } from "@/shared/lib/notifications"
import { logAction } from "@/shared/lib/auditService"
import { useClientCredit } from "@/features/wallet/model/hooks"
import { clientCreditApi } from "@/shared/api/clientCreditApi"
import { prepareBatchDeliveryReceiptForPreview } from "../lib/generateDeliveryReceiptWithPreview"
import {
    buildOrdersByIdForDistributionPdf,
    prepareCreditDistributionSummaryForPreview,
} from "../lib/prepareCreditDistributionSummaryForPreview"
import { usePDFPreview } from "@/shared/hooks/usePDFPreview"
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal"
import { DeliveryDocumentsChoiceModal } from "./DeliveryDocumentsChoiceModal"

interface DeliverOrderModalProps {
    order: Order | null;
    orders?: Order[];
    /** Pedidos visibles en la lista (misma página) para resolver recibo/marca en destinos de distribución */
    contextOrders?: Order[];
    creditDistributions?: Record<string, CreditDistribution>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    onClearSelection?: () => void;
}

export function DeliverOrderModalNew({ 
    order, 
    orders = [], 
    contextOrders = [],
    creditDistributions = {},
    open, 
    onOpenChange, 
    onSuccess,
    onClearSelection
}: DeliverOrderModalProps) {
    const [deliveryNumber, setDeliveryNumber] = useState('')
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

    const [docsChoice, setDocsChoice] = useState<{
        delivery: { document: ReactElement; fileName: string; title: string }
        distribution: { document: ReactElement; fileName: string; title: string } | null
    } | null>(null)
    /** Selector de comprobante: se mantiene `docsChoice` al elegir uno para poder abrir el otro después. */
    const [documentPickerOpen, setDocumentPickerOpen] = useState(false)
    const skipPickerDismissClearRef = useRef(false)

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

    // Fetch delivery number on open
    useEffect(() => {
        if (open && !deliveryNumber) {
            orderApi.generateDeliveryNumber()
                .then(res => {
                    if (res?.deliveryNumber) {
                        setDeliveryNumber(res.deliveryNumber)
                    }
                })
                .catch(err => {
                    console.error("Error generating delivery number - Request or session failure:", err)
                })
        }
        if (!open) setDeliveryNumber('')
    }, [open])

    const keepMountedForDocuments =
        !!docsChoice || !!pdfPreview.pdfDocument

    if (!firstOrder && !keepMountedForDocuments) return null

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

        const ordersByIdSnapshot = buildOrdersByIdForDistributionPdf(
            activeOrders,
            creditDistributions,
            contextOrders
        )

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

            const paymentMethodString = data.payments[0]?.method || "EFECTIVO";

            // UNIFICACIÓN: Siempre usamos batchDeliver para asegurar que se cree un 
            // DeliveryBatch y aparezca en el historial con su número correlativo.
            const targetOrderIds = isBatch ? activeOrders.map(o => o.id) : [firstOrder.id];
            
            const result = await orderApi.batchDeliver(
                targetOrderIds, 
                paymentsToSend, 
                distributionsList,
                { deliveryNumber }
            )
            
            // Capture real delivery number from backend if it corrected/generated one
            const realDeliveryNumber = result?.deliveryNumber || deliveryNumber || 'S/N';

            // RE-FETCH UPDATED ORDERS TO GET NEW BALANCES FOR PDF
            const updatedOrders = await Promise.all(
                targetOrderIds.map(async (id) => {
                    return await orderApi.getById(id)
                })
            )

            const distForPdf = distributionsList.filter(
                (d) =>
                    targetOrderIds.includes(d.sourceOrderId) &&
                    (d.distributions?.length ?? 0) > 0
            )

            let clientWalletTotalAfter: number | null = null
            if (distForPdf.length > 0 && firstOrder.clientId) {
                try {
                    const credits = await clientCreditApi.getAvailableByClient(firstOrder.clientId)
                    clientWalletTotalAfter = credits.reduce(
                        (s, c) => s + Number(c.remainingAmount ?? 0),
                        0
                    )
                } catch (e) {
                    console.warn('[DeliverOrderModalNew] No se pudo leer billetera para PDF distribución', e)
                }
            }

            let distributionPrepared: {
                document: ReactElement
                fileName: string
                title: string
            } | null = null
            if (distForPdf.length > 0) {
                try {
                    distributionPrepared = prepareCreditDistributionSummaryForPreview({
                        distributions: distForPdf,
                        ordersById: ordersByIdSnapshot,
                        deliveryNumber: realDeliveryNumber,
                        clientName: firstOrder.clientName,
                        username: user?.username,
                        clientWalletTotalAfter,
                    })
                } catch (distPdfErr) {
                    console.error('Error preparando PDF distribución', distPdfErr)
                    notifyError({
                        message:
                            'Entrega registrada, pero no se pudo generar el resumen de distribución de saldo',
                    })
                }
            }

            try {
                const deliveryPrepared = await prepareBatchDeliveryReceiptForPreview(
                    updatedOrders,
                    {
                        amountPaidNow: totalPaid,
                        method: paymentMethodString,
                        user: user?.username || 'Administrador',
                        currentCreditAmount: currentCreditAmount,
                        hasCurrentCredit: currentCreditAmount > 0,
                    },
                    realDeliveryNumber
                )

                setDocsChoice({
                    delivery: deliveryPrepared,
                    distribution: distributionPrepared,
                })
                setDocumentPickerOpen(true)
            } catch (pdfError) {
                console.error('Error preparando PDF Batch', pdfError)
                notifyError({
                    message: 'Entrega registrada pero hubo un error al generar el comprobante',
                })
            }

            notifySuccess(isBatch 
                ? `Lote de ${activeOrders.length} entregas registrado correctamente`
                : `Entrega de pedido registrada correctamente`
            )

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
                        ? `Entrega lote ${deliveryNumber} (${activeOrders.length} pedidos). Cliente: ${firstOrder.clientName}. Total cobrado: ${totalPaid.toFixed(2)}`
                        : `Entregó pedido ${firstOrder.receiptNumber} en lote ${deliveryNumber}. Cliente: ${firstOrder.clientName}. Total cobrado: ${totalPaid.toFixed(2)}`
                });
            }

            if (onSuccess) onSuccess()
        } catch (error: any) {
            console.error("[DeliverOrderModalNew] Submission Error:", error);
            
            // Mostrar mensaje detallado del backend (ej: qué pedido falló)
            const errorMsg = error?.message || 'Error desconocido al procesar la entrega';
            notifyError({ 
                message: errorMsg,
                duration: 8000 // Más tiempo para que el usuario pueda leer qué pedido falló
            });

            // Si es un error de concurrencia (pedido ya entregado o índice usado)
            // refrescamos todo para que el usuario vea la realidad
            if (errorMsg.includes('estado') || errorMsg.includes('ya fue') || errorMsg.includes('concurrencia')) {
                qc.invalidateQueries({ queryKey: ['orders'] });
                // Forzamos que se pida un nuevo número de entrega al volver a abrir
                setDeliveryNumber('');
                onClearSelection?.(); // LIMPIAR SELECCIÓN EN CASO DE CONFLICTO
                onOpenChange(false); // Cerramos el modal para que el usuario refresque su selección
            }
            
            throw error; // Re-lanzar para que el PaymentModal sepa que no debe cerrarse exitosamente
        } finally {
            isProcessingRef.current = false
        }
    }

    const openPreparedPreview = (p: { document: ReactElement; fileName: string; title: string }) => {
        setPdfTitle(p.title)
        setPdfFileName(p.fileName)
        pdfPreview.openPreview(p.document)
    }

    const handlePickDelivery = () => {
        if (!docsChoice) return
        skipPickerDismissClearRef.current = true
        setDocumentPickerOpen(false)
        openPreparedPreview(docsChoice.delivery)
    }

    const handlePickDistribution = () => {
        if (!docsChoice?.distribution) return
        skipPickerDismissClearRef.current = true
        setDocumentPickerOpen(false)
        openPreparedPreview(docsChoice.distribution)
    }

    const handleDocumentPickerOpenChange = (v: boolean) => {
        if (v) {
            setDocumentPickerOpen(true)
            return
        }
        setDocumentPickerOpen(false)
        if (skipPickerDismissClearRef.current) {
            skipPickerDismissClearRef.current = false
            return
        }
        if (!pdfPreview.isOpen) {
            setDocsChoice(null)
        }
    }

    const handlePdfPreviewOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            const canOfferOtherDoc = !!docsChoice?.distribution
            pdfPreview.closePreview()
            if (canOfferOtherDoc) {
                setDocumentPickerOpen(true)
            } else {
                setDocsChoice(null)
            }
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
                    initialAmount={totalAmountToCharge}
                    forceExactAmount={true}
                />
            )}

            {docsChoice && (
                <DeliveryDocumentsChoiceModal
                    open={documentPickerOpen}
                    onOpenChange={handleDocumentPickerOpenChange}
                    delivery={docsChoice.delivery}
                    distribution={docsChoice.distribution}
                    onPickDelivery={handlePickDelivery}
                    onPickDistribution={handlePickDistribution}
                />
            )}

            {pdfPreview.pdfDocument && (
                <PDFPreviewModal
                    open={pdfPreview.isOpen}
                    onOpenChange={handlePdfPreviewOpenChange}
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
