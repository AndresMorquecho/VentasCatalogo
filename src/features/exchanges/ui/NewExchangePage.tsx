import { useState, useRef, useEffect, useMemo } from "react"
import { useFormik } from "formik"
import { useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import * as Yup from "yup"
import { ArrowLeft, Plus, X, RefreshCw, Printer, FileText, Search, PackageOpen } from "lucide-react"

import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { AsyncButton } from "@/shared/ui/async-button"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { PageHeader } from "@/shared/ui/PageHeader"

import { useCreateOrder, useOrder, useReceiptOrders } from "@/entities/order/model/hooks"
import type { SalesChannel, OrderType } from "@/entities/order/model/types"
import { getPaidAmount } from "@/entities/order/model/model"
import { orderApi } from "@/entities/order/model/api"
import { useClientList } from "@/features/clients/api/hooks"
import { useBrandList } from "@/features/brands/api/hooks"
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { getActiveBrands } from "@/entities/brand/model/model"
import { useNotifications } from "@/shared/lib/notifications"
import { prepareOrderReceiptForPreview } from "@/features/order-receipt/lib/prepareOrderReceiptForPreview"
import { useAuth } from "@/shared/auth"
import { useCashClosurePreview } from "@/features/cash-closure/api/hooks"
import { PaymentModal, type PaymentModalData } from "@/shared/ui/PaymentModal"
import { usePDFPreview } from "@/shared/hooks/usePDFPreview"
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal"
import { useOrderList } from "@/entities/order/model/hooks"
import { DateRangePicker } from "@/shared/ui/filters"
import type { DateRange } from "react-day-picker"
import { Pagination } from "@/shared/ui/pagination"

/* --- Validation Schema --- */
const validationSchema = Yup.object({
    clientId: Yup.string().required("El cliente es requerido"),
    receiptNumber: Yup.string().required("El N° de recibo es requerido"),
    salesChannel: Yup.string().required("El canal es requerido"),
    brandItems: Yup.array().of(
        Yup.object({
            brandId: Yup.string().required("Requerido"),
            brandName: Yup.string().required("Requerido"),
            quantity: Yup.number().min(1, "Mínimo 1").required("Requerido"),
            total: Yup.number().min(0, "No negativo").required("Requerido"),
            type: Yup.string().required("Requerido"),
            possibleDeliveryDate: Yup.string().required("Requerido"),
            description: Yup.string().optional(),
        })
    ).min(1, "Al menos una marca es requerida"),
    deposit: Yup.number()
        .min(0, "No negativo")
        .required("Requerido"),
    createdAt: Yup.string().required("Fecha de registro requerida"),
    sourceOrder: Yup.object().nullable().optional(),
})

function SourceOrderModal({ 
    isOpen, 
    onClose, 
    clientId, 
    onSelect 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    clientId: string,
    onSelect: (order: any) => void 
}) {
    const [searchTerm, setSearchTerm] = useState("")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [page, setPage] = useState(1)
    
    const filters = useMemo(() => ({
        clientId,
        status: 'ENTREGADO',
        search: searchTerm,
        startDate: dateRange?.from?.toISOString().split('T')[0],
        endDate: dateRange?.to?.toISOString().split('T')[0],
        page,
        limit: 10
    }), [clientId, searchTerm, dateRange, page])

    const { data: response, isLoading } = useOrderList(filters)
    const orders = response?.data || []
    const pagination = response?.pagination

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-[95vw] min-h-[500px] h-[80vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <PackageOpen className="h-5 w-5 text-monchito-purple" />
                        Elegir Pedido Entregado a Cambiar
                    </DialogTitle>
                </DialogHeader>
                
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="w-full">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">Búsqueda (N° pedido, N° orden, Marca)</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Buscar..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-11 border-slate-200 rounded-xl bg-slate-50 focus:ring-monchito-purple/20 text-sm w-full"
                            />
                        </div>
                    </div>
                    <div className="w-full">
                        <DateRangePicker 
                            value={dateRange} 
                            onChange={setDateRange} 
                            showLabel={true}
                            label="Rango de Fecha"
                            className="w-full"
                            buttonClassName="h-11 rounded-xl bg-slate-50 border-slate-200"
                            labelClassName="!text-[10px] !font-black uppercase tracking-widest !text-slate-400 !mb-1.5 !ml-1"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto border rounded-xl bg-slate-50/30">
                    <table className="w-full text-xs text-left">
                        <thead className="sticky top-0 bg-white border-b z-10">
                            <tr className="bg-slate-50/80">
                                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Orden</th>
                                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Pedido</th>
                                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Marca</th>
                                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
                                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Cargando pedidos...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No se encontraron pedidos entregados.</td></tr>
                            ) : (
                                orders.map((o: any) => (
                                    <tr key={o.id} className="hover:bg-white transition-colors group">
                                        <td className="px-4 py-3 font-bold text-slate-700">{o.receiptNumber}</td>
                                        <td className="px-4 py-3 font-medium text-slate-600">{o.orderNumber || '-'}</td>
                                        <td className="px-4 py-3 font-bold text-monchito-purple">{o.brand?.name || o.brandName}</td>
                                        <td className="px-4 py-3 font-black text-slate-900 text-right">${Number(o.total).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="h-8 rounded-lg border-monchito-purple/20 text-monchito-purple hover:bg-monchito-purple hover:text-white transition-all font-bold"
                                                onClick={() => {
                                                    onSelect(o)
                                                    onClose()
                                                }}
                                            >
                                                Seleccionar
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.pages > 1 && (
                    <div className="pt-4 border-t mt-4">
                        <Pagination 
                            currentPage={page} 
                            totalPages={pagination.pages} 
                            onPageChange={setPage} 
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

/* --- Simple Searchable Select Component --- */
interface Option {
    id: string
    label: string
    subLabel?: string
}

function SearchableSelect({
    options,
    value,
    onChange,
    placeholder,
    disabled = false,
    onKeyDownNavigation,
    navId
}: {
    options: Option[],
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    disabled?: boolean,
    onKeyDownNavigation?: (e: React.KeyboardEvent) => void,
    navId?: string
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const wrapperRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(o => o.id === value)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.subLabel && option.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Reset highlighted index when search or open state changes
    useEffect(() => {
        setHighlightedIndex(-1)
    }, [searchTerm, isOpen])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
                setSearchTerm("");
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                    onChange(filteredOptions[highlightedIndex].id);
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'Tab':
                // Let tab function normally but close the dropdown
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                tabIndex={disabled ? -1 : 0}
                className={`flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm items-center justify-between overflow-hidden focus:outline-none focus:ring-1 focus:ring-monchito-purple ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-monchito-purple/50 transition-colors'}`}
                onClick={() => {
                    if (disabled) return;
                    setIsOpen(!isOpen)
                    if (!isOpen) setSearchTerm("") // Reset search on open
                }}
                onKeyDown={(e) => {
                    handleKeyDown(e);
                    if (!isOpen && onKeyDownNavigation) {
                        onKeyDownNavigation(e);
                    }
                }}
                data-nav={navId}
            >
                <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
                    {selectedOption ? `${selectedOption.label} ${selectedOption.subLabel ? `(${selectedOption.subLabel})` : ''}` : placeholder}
                </span>
                <span className="opacity-50 text-xs text-muted-foreground">▼</span>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg bg-white dark:bg-slate-950 ring-1 ring-black ring-opacity-5">
                    <div className="p-2 border-b">
                        <Input
                            autoFocus
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-8"
                        />
                    </div>
                    <div className="max-h-[250px] overflow-auto py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-muted-foreground text-center">No se encontraron resultados</div>
                        ) : (
                            filteredOptions.map((option, idx) => (
                                <div
                                    key={option.id}
                                    className={`relative flex cursor-default select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors ${idx === highlightedIndex ? "bg-monchito-purple/10 text-monchito-purple font-bold" : "hover:bg-indigo-50 hover:text-indigo-900"} ${option.id === value ? "bg-monchito-purple/5" : ""}`}
                                    onClick={() => {
                                        onChange(option.id)
                                        setIsOpen(false)
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span>{option.label}</span>
                                        {option.subLabel && <span className="text-[10px] opacity-70">{option.subLabel}</span>}
                                    </div>
                                    {option.id === value && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-monchito-purple" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export function NewExchangePage() {
    const { id, receiptNumber } = useParams()
    const navigate = useNavigate()
    const isEditing = !!(id || receiptNumber)
    const queryClient = useQueryClient()

    // Caso 1: Edición por receiptNumber (carga múltiples pedidos)
    const { data: receiptOrders, isLoading: isLoadingReceiptOrders } = useReceiptOrders(receiptNumber || "")
    
    // Caso 2: Edición por ID individual (carga un solo pedido)
    const { data: order, isLoading: isLoadingOrder } = useOrder(id || "")
    
    const { data: clientsResponse } = useClientList({ limit: 1000 })
    const { data: brandsResponse } = useBrandList({ limit: 500 })

    const clients = clientsResponse?.data || []
    const brands = brandsResponse?.data || []
    
    useBankAccountList()
    
    const createOrder = useCreateOrder()
    const { notifySuccess, notifyError } = useNotifications()
    const { user } = useAuth()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingRelated, setIsLoadingRelated] = useState(false)
    const [globalNextOrderNumber, setGlobalNextOrderNumber] = useState<string>("")
    
    // Estados para confirmación de eliminación
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [orderToDelete, setOrderToDelete] = useState<any>(null)
    const [lastClosureDate, setLastClosureDate] = useState<Date | null>(null)

    const [paymentModalOpen, setPaymentModalOpen] = useState(false)

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

    // State for the item being added
    const [currentItem, setCurrentItem] = useState({
        brandId: "",
        brandName: "",
        quantity: 1,
        total: 0,
        type: "CAMBIO" as OrderType,
        possibleDeliveryDate: new Date().toISOString().split('T')[0],
        salesChannel: "OFICINA" as SalesChannel,
        orderNumber: "",
        description: "",
        deposit: 0,
        // Original Order Info (Source)
        sourceOrderId: "",
        sourceOrderNumber: "",
        sourceBrandId: "",
        sourceBrandName: "",
        sourceQuantity: 1,
        sourceDescription: ""
    })

    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false)

    // Función para procesar el pago y crear el recibo
    const handlePaymentSubmit = async (paymentData: PaymentModalData) => {
        setIsSubmitting(true);
        try {
            const totalAmount = paymentData.payments.reduce((sum, p) => sum + p.amount, 0);
            const walletCreditUsed = paymentData.payments
                .filter(p => p.method === 'BILLETERA_VIRTUAL')
                .reduce((sum, p) => sum + p.amount, 0);

            const activePayments = paymentData.payments.filter(p => p.amount > 0);
            const isSplitPayment = activePayments.length > 1;

            // Detectar si el usuario especificó abonos individuales por fila
            const hasUserSpecifiedDeposits = formik.values.brandItems.some(item => 
                Number(item.deposit) > 0
            );

            // Construir el batchPayload — todo en una sola transacción atómica
            const batchPayload = {
                receipt_number: formik.values.receiptNumber,
                client_id: formik.values.clientId,
                sales_channel: formik.values.salesChannel,
                created_at: new Date().toISOString(),
                payment_method: activePayments[0]?.method || "EFECTIVO",
                bank_account_id: activePayments[0]?.bankAccountId || "",
                transaction_date: new Date().toISOString().split('T')[0],
                transaction_reference: activePayments[0]?.transactionReference || "",
                deposit: totalAmount,
                credit_to_use: walletCreditUsed,
                notes: activePayments[0]?.notes || formik.values.notes,
                // Split payment: múltiples métodos de pago
                ...(isSplitPayment && {
                    payment_data: {
                        payments: activePayments.map(p => ({
                            method: p.method,
                            amount: p.amount,
                            bankAccountId: p.bankAccountId,
                            transactionDate: new Date().toISOString().split('T')[0],
                            transactionReference: p.transactionReference,
                            notes: p.notes
                        })),
                        walletCreditUsed,
                        totalAmount
                    }
                }),
                orders: formik.values.brandItems.map((item) => {
                    const unitPrice = item.quantity > 0 ? item.total / item.quantity : 0;
                    let rowDeposit = Number(item.deposit) || 0;
                    
                    if (!hasUserSpecifiedDeposits && totalAmount > 0) {
                        const proportion = totalOrderValue > 0 ? Number(item.total) / totalOrderValue : 1 / formik.values.brandItems.length;
                        rowDeposit = Math.round(totalAmount * proportion * 100) / 100;
                    }
                    
                    // Construct the combined description for the backend audit trail
                    const structuredNotes = `CAMBIO DE [${item.sourceOrderNumber} ${item.sourceBrandName} x${item.sourceQuantity}: ${item.sourceDescription || 'Sin detalle'}] POR [${item.brandName} x${item.quantity}: ${item.description || 'Sin detalle'}]`;

                    return {
                        brand_id: item.brandId,
                        brand_name: item.brandName,
                        total: item.total,
                        deposit: rowDeposit,
                        type: item.type,
                        notes: structuredNotes, // Ensure the backend gets the full context
                        possible_delivery_date: item.possibleDeliveryDate,
                        source_order_id: item.sourceOrderId || undefined,
                        order_number: item.orderNumber || "",
                        items: [{
                            product_name: item.brandName,
                            quantity: item.quantity,
                            unit_price: unitPrice
                        }]
                    };
                })
            };

            const createdOrders = await orderApi.batchCreate(batchPayload);

            // Invalidar queries
            await queryClient.invalidateQueries({ queryKey: ['orders'] });
            await queryClient.invalidateQueries({ queryKey: ['financial-records'] });
            await queryClient.invalidateQueries({ queryKey: ['transactions'] });

            // Map orderNumbers from original form values back to the created orders
            const ordersWithNumbers = createdOrders.map((createdOrder: any, index: number) => {
                const originalItem = formik.values.brandItems[index];
                return {
                    ...createdOrder,
                    orderNumber: originalItem.orderNumber
                };
            });

            try {
                const { document, fileName, title } = await prepareOrderReceiptForPreview(
                    ordersWithNumbers[0],
                    {
                        id: user?.id || '1',
                        username: user?.username || 'Vendedor',
                        role: 'OPERATOR',
                        email: '',
                        status: 'ACTIVE',
                        createdAt: new Date().toISOString()
                    } as any,
                    ordersWithNumbers.slice(1)
                )
                
                setPdfTitle(title)
                setPdfFileName(fileName)
                pdfPreview.openPreview(document)
                
                notifySuccess(`Se han creado ${createdOrders.length} pedidos exitosamente.`);
            } catch (pdfError) {
                console.error("Error preparing PDF", pdfError)
                notifyError(pdfError, "Error al preparar el recibo PDF.")
                notifySuccess(`Se han creado ${createdOrders.length} pedidos exitosamente.`);
                navigate('/exchanges');
            }
        } catch (error: any) {
            console.error("Error saving order", error)
            notifyError(error, "Error al guardar el pedido.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const formik = useFormik({
        initialValues: {
            clientId: "",
            receiptNumber: "",
            salesChannel: "OFICINA" as SalesChannel,
            brandItems: [] as any[],
            deposit: 0,
            creditToUse: 0,
            createdAt: new Date().toISOString().split('T')[0],
            transactionDate: new Date().toISOString().split('T')[0],
            paymentMethod: "EFECTIVO",
            notes: "",
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async () => {}
    })

    useEffect(() => {
        if (formik.submitCount > 0 && !formik.isValid) {
            notifyError(null, "Hay campos inválidos en el formulario. Por favor revisa los datos marcados.")
        }
    }, [formik.submitCount, formik.isValid])

    const generateNextReceiptNumber = async () => {
        try {
            const { receiptNumber } = await orderApi.generateReceiptNumber();
            formik.setFieldValue('receiptNumber', receiptNumber);
        } catch (error) {
            console.error('Error generating receipt number:', error);
            const year = new Date().getFullYear();
            formik.setFieldValue('receiptNumber', `OR-${year}-001`);
        }
    };

    const generateNextOrderNumber = async () => {
        try {
            const { orderNumber } = await orderApi.generateOrderNumber();
            // Reemplazar PD- por CAM-
            const exchangeOrderNumber = orderNumber.replace('PD-', 'CAM-');
            setGlobalNextOrderNumber(exchangeOrderNumber);
            if (!currentItem.orderNumber || currentItem.orderNumber.startsWith(`PD-`) || currentItem.orderNumber.startsWith('CAM-')) {
                setCurrentItem(prev => ({ ...prev, orderNumber: exchangeOrderNumber }));
            }
        } catch (error) {
            console.error('Error generating order number:', error);
            const year = new Date().getFullYear();
            setGlobalNextOrderNumber(`CAM-${year}-001`);
        }
    };

    const validateReceiptNumber = async (receiptNumber: string): Promise<boolean> => {
        if (!receiptNumber || isEditing) return true;
        try {
            const { exists } = await orderApi.checkReceiptExists(receiptNumber);
            if (exists) {
                formik.setFieldError('receiptNumber', 'Este número de recibo ya existe');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error validating receipt number:', error);
            return true;
        }
    };

    const canEditOrder = (order: any): { canEdit: boolean; reason?: string } => {
        if (lastClosureDate && order.transactionDate) {
            const transactionDate = new Date(order.transactionDate)
            if (transactionDate <= lastClosureDate) {
                return { canEdit: false, reason: 'No se puede editar: El periodo de caja ya está cerrado.' }
            }
        }
        if (order.status === 'RECIBIDO_EN_BODEGA') {
            return { canEdit: false, reason: 'No se puede editar: El pedido ya ha sido receptado en bodega.' }
        }
        if (order.status === 'ENTREGADO') {
            return { canEdit: false, reason: 'No se puede editar: El pedido ya ha sido entregado.' }
        }
        if (order.status && order.status !== 'POR_RECIBIR') {
            return { canEdit: false, reason: `No se puede editar: El pedido ya está en estado ${order.status}.` }
        }
        const payments = order.payments || [];
        const hasExtraPayments = payments.length > 2 || (payments.length > 1 && !payments.some((p: any) => p.method === 'CREDITO_CLIENTE'));
        if (hasExtraPayments) {
            return { canEdit: false, reason: 'No se puede editar este pedido: Ya tiene abonos adicionales vinculados.' }
        }
        return { canEdit: true }
    }

    const canDeleteOrder = (order: any) => canEditOrder(order)

    const canAddNewItem = () => {
        const dateToCheck = isEditing && formik.values.createdAt ? new Date(formik.values.createdAt) : new Date()
        if (lastClosureDate && dateToCheck) {
            if (dateToCheck <= lastClosureDate) {
                return { canEdit: false, reason: 'No se puede agregar: El periodo de caja ya está cerrado para la fecha de este recibo.' }
            }
        }
        return { canEdit: true }
    }

    const handleDeleteOrder = (order: any) => {
        const validation = canDeleteOrder(order)
        if (!validation.canEdit) {
            notifyError(null, validation.reason || 'No se puede eliminar este pedido')
            return
        }
        setOrderToDelete(order)
        setDeleteConfirmOpen(true)
    }

    const confirmDeleteOrder = async () => {
        if (!orderToDelete) return
        try {
            await orderApi.delete(orderToDelete.id)
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            queryClient.invalidateQueries({ queryKey: ['order', orderToDelete.id] })
            queryClient.invalidateQueries({ queryKey: ['receiptOrders', orderToDelete.receiptNumber] })
            notifySuccess('Pedido eliminado correctamente.')
        } catch (error: any) {
            notifyError(error, 'Error al eliminar el pedido.')
        } finally {
            setDeleteConfirmOpen(false)
            setOrderToDelete(null)
        }
    }

    useEffect(() => {
        if (currentItem.type === 'REPROGRAMACION') {
            const lastValidItem = [...formik.values.brandItems].reverse().find(
                item => item.type === 'NORMAL' || item.type === 'PREVENTA'
            );
            if (lastValidItem) {
                if (currentItem.brandId !== lastValidItem.brandId || currentItem.orderNumber !== lastValidItem.orderNumber) {
                    setCurrentItem(prev => ({ 
                        ...prev, 
                        brandId: lastValidItem.brandId,
                        brandName: lastValidItem.brandName,
                        orderNumber: lastValidItem.orderNumber || prev.orderNumber 
                    }));
                }
                return;
            }
        }

        const numbersInList = formik.values.brandItems
            .map(item => item.orderNumber)
            .filter(num => num && num.startsWith('CAM-'));
        const uniqueNumbersCount = new Set(numbersInList).size;
        let nextNum = "";
        if (uniqueNumbersCount > 0) {
            // Extraer el número del global para mantener la secuencia pero con el offset de la lista actual
            const basePrefix = `CAM-${new Date().getFullYear()}-`;
            nextNum = `${basePrefix}${String(uniqueNumbersCount + 1).padStart(3, '0')}`;
        } else if (globalNextOrderNumber) {
            nextNum = globalNextOrderNumber;
        } else {
            nextNum = `CAM-${new Date().getFullYear()}-001`;
        }
        
        if ((!currentItem.orderNumber || currentItem.orderNumber.startsWith('CAM-') || currentItem.orderNumber.startsWith('PD-')) && currentItem.orderNumber !== nextNum) {
            setCurrentItem(prev => ({ ...prev, orderNumber: nextNum }));
        }
    }, [currentItem.brandId, currentItem.type, formik.values.brandItems.length, globalNextOrderNumber]);

    useEffect(() => {
        const loadAllItems = async () => {
            if (receiptNumber && !isLoadingReceiptOrders) {
                if (receiptOrders && receiptOrders.length > 0) {
                    setIsLoadingRelated(true);
                    try {
                        const allItems = receiptOrders;
                        const firstOrder = allItems[0];
                        const parentOrderNumber = allItems.find(item => item.type === 'NORMAL' || item.type === 'PREVENTA')?.orderNumber || "";
                        formik.setValues({
                            clientId: firstOrder.clientId || "",
                            receiptNumber: firstOrder.receiptNumber || "",
                            salesChannel: (firstOrder.salesChannel as SalesChannel) || "OFICINA",
                            brandItems: allItems.map((o: any) => ({
                                id: o.id,
                                brandId: o.brandId,
                                brandName: o.brand?.name || o.brandName || "Sin marca",
                                quantity: o.items?.[0]?.quantity || 1,
                                total: Number(o.total) || 0,
                                type: o.type || "NORMAL",
                                possibleDeliveryDate: o.possibleDeliveryDate ? new Date(o.possibleDeliveryDate).toISOString().split('T')[0] : "",
                                salesChannel: o.salesChannel || "OFICINA",
                                orderNumber: o.orderNumber || (o.type === 'REPROGRAMACION' ? parentOrderNumber : ""),
                                bankAccountId: o.bankAccountId,
                                deposit: getPaidAmount(o) || 0,
                                status: o.status,
                                payments: o.payments,
                                receiptNumber: o.receiptNumber || "",
                                clientId: o.clientId || "",
                                clientName: o.clientName || ""
                            })),
                            deposit: 0,
                            creditToUse: 0,
                            createdAt: firstOrder.createdAt ? new Date(firstOrder.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            transactionDate: firstOrder.transactionDate ? new Date(firstOrder.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            paymentMethod: firstOrder.paymentMethod || "EFECTIVO",
                            notes: firstOrder.notes || "",
                        });
                    } catch (err) {
                        notifyError(null, "No se pudieron cargar todos los pedidos del recibo.");
                    } finally {
                        setIsLoadingRelated(false);
                    }
                }
            } else if (order && id) {
                setIsLoadingRelated(true);
                try {
                    const response = await orderApi.getAll({ search: order.receiptNumber, limit: 100 });
                    const allItems = (response as any).data || (Array.isArray(response) ? response : [order]);
                    const parentOrderNumber = allItems.find((item: any) => item.type === 'NORMAL' || item.type === 'PREVENTA')?.orderNumber || "";
                    formik.setValues({
                        clientId: order.clientId || "",
                        receiptNumber: order.receiptNumber || "",
                        salesChannel: (order.salesChannel as SalesChannel) || "OFICINA",
                        brandItems: allItems.map((o: any) => ({
                            id: o.id,
                            brandId: o.brandId,
                            brandName: o.brand?.name || o.brandName || "Sin marca",
                            quantity: o.items?.[0]?.quantity || 1,
                            total: Number(o.total) || 0,
                            type: o.type || "NORMAL",
                            possibleDeliveryDate: o.possibleDeliveryDate ? new Date(o.possibleDeliveryDate).toISOString().split('T')[0] : "",
                            salesChannel: o.salesChannel || "OFICINA",
                            orderNumber: o.orderNumber || (o.type === 'REPROGRAMACION' ? parentOrderNumber : ""),
                            bankAccountId: o.bankAccountId,
                            deposit: getPaidAmount(o) || 0,
                            status: o.status,
                            payments: o.payments,
                            receiptNumber: o.receiptNumber || "",
                            clientId: o.clientId || "",
                            clientName: o.clientName || ""
                        })),
                        deposit: 0,
                        creditToUse: 0,
                        createdAt: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        transactionDate: order.transactionDate ? new Date(order.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        paymentMethod: order.paymentMethod || "EFECTIVO",
                        notes: order.notes || "",
                    });
                } catch (err) {
                    notifyError(null, "No se pudieron cargar todos los pedidos del recibo.");
                } finally {
                    setIsLoadingRelated(false);
                }
            } else if (!isEditing) {
                generateNextReceiptNumber();
                generateNextOrderNumber();
            }
        };
        loadAllItems();
    }, [order, receiptOrders, isEditing, id, receiptNumber]);

    const { data: closurePreview } = useCashClosurePreview()
    useEffect(() => { if (closurePreview?.lastClosureDate) setLastClosureDate(new Date(closurePreview.lastClosureDate)) }, [closurePreview])

    const totalOrderValue = formik.values.brandItems.reduce((sum, item) => sum + Number(item.total), 0);
    const totalRowDeposit = formik.values.brandItems.reduce((sum, item) => sum + Number(item.deposit || 0), 0);
    const balance = totalOrderValue - totalRowDeposit - Number(formik.values.creditToUse);

    const clientOptions = clients.map(c => ({ id: c.id, label: c.firstName, subLabel: c.identificationNumber }))
    const brandOptions = getActiveBrands(brands).map(b => ({ id: b.id, label: b.name, subLabel: "" }))

    const handleAddItem = async () => {
        if (!currentItem.brandId) { notifyError(null, "Seleccione una marca"); return; }
        if (currentItem.total < 0) { notifyError(null, "El valor no puede ser negativo"); return; }
        const validation = canAddNewItem()
        if (!validation.canEdit) { notifyError(null, validation.reason || 'No se puede agregar'); return }

        if (isEditing) {
            try {
                setIsSubmitting(true)
                const itemsToCreate = [currentItem]
                const firstExistingOrder = formik.values.brandItems.find((item: any) => item.id)
                const parentOrderId = firstExistingOrder?.id || null
                const client = clients.find(c => c.id === formik.values.clientId);
                const clientName = client ? client.firstName : "Desconocido";

                for (const itemToCreate of itemsToCreate) {
                    const unitPrice = itemToCreate.quantity > 0 ? itemToCreate.total / itemToCreate.quantity : 0
                    const payload = {
                        clientId: formik.values.clientId,
                        clientName,
                        receiptNumber: formik.values.receiptNumber,
                        salesChannel: itemToCreate.salesChannel || formik.values.salesChannel,
                        type: itemToCreate.type,
                        brandId: itemToCreate.brandId,
                        brandName: itemToCreate.brandName,
                        total: itemToCreate.total,
                        possibleDeliveryDate: itemToCreate.possibleDeliveryDate,
                        notes: itemToCreate.description || formik.values.notes,
                        createdAt: formik.values.createdAt,
                        transaction_date: formik.values.transactionDate,
                        paymentMethod: formik.values.paymentMethod,
                        items: [{
                            productName: itemToCreate.brandName,
                            quantity: itemToCreate.quantity,
                            unitPrice: unitPrice,
                            brandId: itemToCreate.brandId,
                            brandName: itemToCreate.brandName
                        }],
                        deposit: 0,
                        creditToUse: 0,
                        parentOrderId: parentOrderId || undefined,
                        orderNumber: itemToCreate.orderNumber?.trim() || undefined
                    }
                    await createOrder.mutateAsync(payload as any)
                }
                queryClient.invalidateQueries({ queryKey: ['orders'] })
                queryClient.invalidateQueries({ queryKey: ['receiptOrders', formik.values.receiptNumber] })
                notifySuccess(`Pedido de cambio agregado correctamente.`)
                setCurrentItem(prev => ({ ...prev, brandId: "", brandName: "", total: 0, quantity: 1, orderNumber: "", description: "" }))
            } catch (error: any) {
                notifyError(error, 'Error al agregar el cambio.')
            } finally { setIsSubmitting(false) }
        } else {
            const baseId = crypto.randomUUID();
            // Guardamos el objeto actual sin machacar la descripción con el resumen estructurado aún
            // para poder mostrar las columnas separadas en la tabla
            formik.setFieldValue("brandItems", [...formik.values.brandItems, { 
                ...currentItem, 
                tempId: baseId, 
                deposit: 0 
            }]);
            
            // Reset ALL fields
            setCurrentItem({
                brandId: "",
                brandName: "",
                quantity: 1,
                total: 0,
                deposit: 0,
                type: "CAMBIO" as OrderType,
                possibleDeliveryDate: new Date().toISOString().split('T')[0],
                salesChannel: "OFICINA" as SalesChannel,
                orderNumber: "",
                description: "",
                sourceOrderId: "",
                sourceOrderNumber: "",
                sourceBrandId: "",
                sourceBrandName: "",
                sourceQuantity: 1,
                sourceDescription: ""
            });
        }
    }

    const removeItem = (index: number) => {
        const itemToRemove = formik.values.brandItems[index];
        if (isEditing && itemToRemove.id) { handleDeleteOrder(itemToRemove); return; }
        const items = formik.values.brandItems.filter((_, i) => i !== index);
        formik.setFieldValue("brandItems", items);
    }

    const handlePrintReceipt = async () => {
        try {
            setIsSubmitting(true)
            const allOrders = formik.values.brandItems.filter((item: any) => item.id)
            if (allOrders.length === 0) { notifyError(null, 'No hay pedidos para imprimir.'); return; }
            const client = clients.find((c: any) => c.id === formik.values.clientId)
            if (!client) { notifyError(null, 'No se encontró información del cliente.'); return; }
            try {
                const { document, fileName, title } = await prepareOrderReceiptForPreview(
                    allOrders[0],
                    { id: user?.id || '1', name: user?.username || 'Vendedor', role: 'OPERATOR', email: '' } as any,
                    allOrders.slice(1)
                )
                setPdfTitle(title); setPdfFileName(fileName); pdfPreview.openPreview(document);
                notifySuccess('Recibo preparado para visualización.')
            } catch (pdfError) { notifyError(pdfError, 'Error al preparar el recibo.') }
        } catch (error: any) { notifyError(error, 'Error al generar el recibo.') } finally { setIsSubmitting(false) }
    }

    if ((isEditing && (isLoadingOrder || isLoadingReceiptOrders)) || isLoadingRelated) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <RefreshCw className="h-10 w-10 animate-spin text-slate-800" />
                <p className="text-slate-500 font-medium animate-pulse">Cargando datos...</p>
            </div>
        )
    }

    const handleMainSave = async () => {
        if (formik.values.brandItems.length === 0) { notifyError(null, "Debe agregar al menos una marca."); return; }
        if (Object.keys(formik.errors).length > 0) { notifyError(null, "Revise los errores en el formulario."); return; }
        if (!isEditing) {
            const isValidReceipt = await validateReceiptNumber(formik.values.receiptNumber);
            if (!isValidReceipt) return;
        }
        setPaymentModalOpen(true)
    }

    return (
        <>
            <div className="space-y-6">
            <PageHeader 
                title={isEditing ? 'Editar Guía de Cambio' : 'Nueva Guía de Cambio'} 
                description="Crea una nueva guía de cambio similar a un pedido"
                icon={FileText}
                actions={
                    <Button variant="outline" onClick={() => navigate('/exchanges')} className="gap-2 rounded-xl border-slate-200 shadow-sm">
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Cambios
                    </Button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Header Card */}
                <Card className="lg:col-span-3 border-slate-200 shadow-xl shadow-slate-100 rounded-2xl">
                    <CardHeader className="bg-slate-50/50 py-2 border-b border-slate-100">
                        <CardTitle className="text-[10px] font-black text-monchito-purple uppercase tracking-widest">Encabezado de Cambio</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-2 space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">N° de cambio:</Label>
                                <Input
                                    name="receiptNumber"
                                    value={formik.values.receiptNumber}
                                    onChange={formik.handleChange}
                                    className="h-9 font-bold bg-white border-slate-200 rounded-xl focus:ring-monchito-purple/20 transition-all uppercase text-xs"
                                    placeholder="CAM-XXXX"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Fecha:</Label>
                                <Input
                                    type="date"
                                    name="createdAt"
                                    value={formik.values.createdAt}
                                    onChange={formik.handleChange}
                                    disabled={isEditing}
                                    className="h-9 rounded-xl border-slate-200 bg-white text-xs"
                                />
                            </div>
                            <div className="md:col-span-8 space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Empresaria / Cliente:</Label>
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1 w-full relative">
                                        <SearchableSelect
                                            placeholder="Seleccionar Empresaria..."
                                            options={clientOptions}
                                            value={formik.values.clientId}
                                            onChange={(val) => {
                                                formik.setFieldValue("clientId", val);
                                            }}
                                            disabled={isEditing}
                                        />
                                    </div>
                                    <Button 
                                        type="button"
                                        onClick={() => setIsSourceModalOpen(true)}
                                        disabled={!formik.values.clientId}
                                        className="h-9 px-4 bg-monchito-purple hover:bg-monchito-purple/90 text-white font-black rounded-xl shadow-lg shadow-monchito-purple/20 transition-all text-[9.5px] uppercase tracking-widest flex items-center gap-2 shrink-0"
                                    >
                                        <PackageOpen className="h-4 w-4" />
                                        Elegir pedido
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Resumen Total (Side Column) */}
                <Card className="border-slate-200 shadow-xl shadow-slate-100 rounded-2xl flex flex-col justify-between">
                    <CardHeader className="bg-slate-50/50 py-2 border-b border-slate-100">
                        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valores</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10.5px]">
                                <span className="text-slate-500 font-bold uppercase tracking-tighter">Total Cambio:</span>
                                <span className="font-black text-slate-900">${totalOrderValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10.5px] text-emerald-600">
                                <span className="font-bold uppercase tracking-tighter">Total Abono:</span>
                                <span className="font-black">${(totalRowDeposit + Number(formik.values.creditToUse)).toFixed(2)}</span>
                            </div>
                        </div>
                        <Separator className="bg-slate-100" />
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Saldo:</span>
                            <span className={`text-lg font-black ${balance > 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                ${balance.toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

                {/* Items Card (Full Width) */}
                <Card className="border-slate-200 shadow-xl shadow-slate-100 rounded-2xl">
                    <div className="p-6">
                        {/* Title for the Item entry section */}
                        <div className="mb-4 flex items-center gap-2">
                            <div className="h-6 w-1 bg-monchito-purple rounded-full"></div>
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Ingrese el ítems a cambiar</span>
                        </div>

                        {/* ROW 1: ORIGINAL ITEM (SOURCE) */}
                        <div className="flex flex-wrap lg:flex-nowrap gap-3 items-end mb-3">
                            <div className="w-full sm:w-[130px] space-y-1 shrink-0">
                                <Label className="text-xs font-bold uppercase text-slate-500">No Pedido Orig:</Label>
                                <Input
                                    value={currentItem.sourceOrderNumber}
                                    onChange={(e) => setCurrentItem(prev => ({ ...prev, sourceOrderNumber: e.target.value }))}
                                    className="h-8 font-mono font-bold bg-slate-50 border-slate-200 rounded-md text-xs px-2"
                                    placeholder="PD-XXXX"
                                />
                            </div>
                            <div className="w-full sm:w-[60px] space-y-1 shrink-0">
                                <Label className="text-xs font-bold uppercase text-slate-500">Cant:</Label>
                                <Input
                                    type="number"
                                    value={currentItem.sourceQuantity}
                                    onChange={(e) => setCurrentItem(prev => ({ ...prev, sourceQuantity: Number(e.target.value) }))}
                                    className="h-8 text-center font-bold border-slate-200 rounded-md text-xs px-1 hide-spinner"
                                />
                            </div>
                            <div className="w-full sm:flex-1 min-w-[140px] space-y-1">
                                <Label className="text-xs font-bold uppercase text-slate-500">Catálogo Orig:</Label>
                                <SearchableSelect
                                    placeholder="Marca..."
                                    options={brandOptions}
                                    value={currentItem.sourceBrandId}
                                    onChange={(val) => {
                                        const brand = brands.find(b => b.id === val);
                                        setCurrentItem(prev => ({ ...prev, sourceBrandId: val, sourceBrandName: brand?.name || "" }));
                                    }}
                                />
                            </div>
                            <div className="w-full sm:flex-[2] min-w-[200px] space-y-1">
                                <Label className="text-xs font-bold uppercase text-slate-500">Descripción del cambio (Se va):</Label>
                                <Input
                                    placeholder="Detalles sobre lo que se devuelve..."
                                    value={currentItem.sourceDescription}
                                    onChange={(e) => setCurrentItem(prev => ({ ...prev, sourceDescription: e.target.value }))}
                                    className="h-8 text-xs border-slate-200 rounded-md px-2"
                                />
                            </div>
                        </div>

                        {/* SEPARATOR: POR CAMBIO */}
                        <div className="relative h-6 flex items-center justify-center my-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-dashed border-slate-200"></div>
                            </div>
                            <div className="relative px-4 bg-white">
                                <span className="text-[9px] font-black text-monchito-purple uppercase tracking-[0.2em] bg-white border-2 border-monchito-purple/20 px-2.5 py-0.5 rounded-full shadow-sm">
                                    POR CAMBIO
                                </span>
                            </div>
                        </div>

                        {/* ROW 2: NEW ITEM (REPLACEMENT) */}
                        <div className="flex flex-wrap lg:flex-nowrap gap-3 items-end mb-4">
                            <div className="w-full sm:w-[110px] space-y-1 shrink-0">
                                <Label className="text-xs font-bold uppercase text-slate-500">Pedido por:</Label>
                                <select 
                                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 font-bold focus:ring-1 focus:ring-monchito-purple outline-none transition-all cursor-pointer"
                                    value={currentItem.salesChannel}
                                    onChange={(e) => setCurrentItem(prev => ({ ...prev, salesChannel: e.target.value as SalesChannel }))}
                                >
                                    <option value="OFICINA">OFICINA</option>
                                    <option value="WHATSAPP">WHATSAPP</option>
                                    <option value="INSTAGRAM">INSTAGRAM</option>
                                    <option value="WEB">WEB</option>
                                </select>
                            </div>
                            <div className="w-full sm:w-[60px] space-y-1 shrink-0">
                                <Label className="text-xs font-bold uppercase text-slate-500">Cant:</Label>
                                <Input
                                    type="number"
                                    value={currentItem.quantity}
                                    onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                                    className="h-8 text-center font-bold border-slate-200 rounded-md px-1 text-xs hide-spinner"
                                />
                            </div>
                            <div className="w-full sm:flex-1 min-w-[140px] space-y-1">
                                <Label className="text-xs font-bold uppercase text-slate-500">Catálogo/Marca:</Label>
                                <SearchableSelect
                                    placeholder="Marca..."
                                    options={brandOptions}
                                    value={currentItem.brandId}
                                    onChange={(val) => {
                                        const brand = brands.find(b => b.id === val);
                                        setCurrentItem(prev => ({ ...prev, brandId: val, brandName: brand?.name || "" }));
                                    }}
                                />
                            </div>
                            <div className="w-full sm:flex-1 min-w-[180px] space-y-1">
                                <Label className="text-xs font-bold uppercase text-slate-500">Descripción:</Label>
                                <Input
                                    placeholder="Detalles sobre el cambio..."
                                    value={currentItem.description}
                                    onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
                                    className="h-8 text-xs border-slate-200 rounded-md px-2"
                                />
                            </div>
                            <div className="w-full sm:w-[80px] space-y-1 shrink-0">
                                <Label className="text-xs font-bold uppercase text-slate-500 text-right pr-2">Valor:</Label>
                                <Input
                                    type="number"
                                    value={currentItem.total}
                                    onChange={(e) => setCurrentItem(prev => ({ ...prev, total: Number(e.target.value) }))}
                                    className="h-8 text-right font-black text-emerald-600 border-slate-200 rounded-md px-2 text-xs hide-spinner"
                                />
                            </div>
                            <div className="w-full sm:w-[135px] space-y-1 shrink-0">
                                <Label className="text-xs font-bold uppercase text-slate-500">Entrega:</Label>
                                <Input
                                    type="date"
                                    value={currentItem.possibleDeliveryDate}
                                    onChange={(e) => setCurrentItem(prev => ({ ...prev, possibleDeliveryDate: e.target.value }))}
                                    className="h-8 text-xs border-slate-200 rounded-md px-2"
                                />
                            </div>
                            <div className="w-full sm:w-[130px] shrink-0">
                                <AsyncButton 
                                    onClick={handleAddItem}
                                    isLoading={isSubmitting}
                                    className="h-8 w-full bg-monchito-purple hover:bg-monchito-purple/90 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center"
                                >
                                    <Plus className="h-3 w-3 mr-1.5" /> Agregar
                                </AsyncButton>
                            </div>
                        </div>

                                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
                                    <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
                                        <thead>
                                            <tr className="bg-monchito-purple/5 border-b border-monchito-purple/10">
                                                <th className="px-2 py-3 border-r border-monchito-purple/10 text-center w-8 text-[10px] font-black text-monchito-purple uppercase tracking-widest">N°</th>
                                                <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Pedido por</th>
                                                <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">N° de pedido</th>
                                                <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Tipo</th>
                                                <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Catálogo</th>
                                                <th className="px-2 py-3 border-r border-monchito-purple/10 text-center w-20 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Cant</th>
                                                <th className="px-2 py-3 border-r border-monchito-purple/10 text-right min-w-[100px] text-[10px] font-black text-monchito-purple uppercase tracking-widest">Valor</th>
                                                <th className="px-2 py-3 border-r border-monchito-purple/10 text-right min-w-[100px] text-[10px] font-black text-monchito-purple uppercase tracking-widest">Abono</th>
                                                <th className="px-2 py-3 border-r border-monchito-purple/10 text-right min-w-[100px] text-[10px] font-black text-monchito-purple uppercase tracking-widest">Saldo</th>
                                                <th className="px-2 py-3 border-r border-monchito-purple/10 text-center min-w-[130px] text-[10px] font-black text-monchito-purple uppercase tracking-widest">Entrega</th>
                                                <th className="px-2 py-3 text-center w-20 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Accion</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 bg-white">
                                            {formik.values.brandItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={11} className="px-4 py-12 text-center text-slate-400 italic">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <PackageOpen className="h-10 w-10 opacity-20" />
                                                            <span>No hay cambios agregados a esta guía</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                formik.values.brandItems.map((item, idx) => (
                                                    <tr key={item.id || item.tempId || idx} className="hover:bg-monchito-purple/5 transition-all duration-200 border-b border-slate-50 last:border-0 text-xs">
                                                        <td className="px-2 py-2 border-r border-slate-50 text-center font-bold text-slate-400">{idx + 1}</td>
                                                        <td className="px-2 py-2 border-r border-slate-50">
                                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-black uppercase">{item.salesChannel}</span>
                                                        </td>
                                                        <td className="px-2 py-2 border-r border-slate-50 font-black text-monchito-purple">{item.orderNumber}</td>
                                                        <td className="px-2 py-2 border-r border-slate-50">
                                                            <span className="text-[10px] font-black text-monchito-purple/60 uppercase tracking-tighter">CAMBIO</span>
                                                        </td>
                                                        <td className="px-2 py-2 border-r border-slate-50 font-bold text-slate-700">{item.brandName}</td>
                                                        <td className="px-2 py-2 border-r border-slate-50 text-center font-black text-slate-500">{item.quantity}</td>
                                                        <td className="px-2 py-2 border-r border-slate-50 text-right font-black text-slate-900">${Number(item.total).toFixed(2)}</td>
                                                        <td className="px-2 py-2 border-r border-slate-50 text-right font-bold text-emerald-600">${Number(item.deposit || 0).toFixed(2)}</td>
                                                        <td className="px-2 py-2 border-r border-slate-50 text-right font-black text-red-500">${(Number(item.total) - Number(item.deposit || 0)).toFixed(2)}</td>
                                                        <td className="px-2 py-2 border-r border-slate-50 text-center text-slate-500 font-medium">{item.possibleDeliveryDate}</td>
                                                        <td className="px-2 py-2 text-center text-xs">
                                                            <div className="flex justify-center">
                                                                {!isEditing && (
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        onClick={() => removeItem(idx)} 
                                                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </Card>

                    {/* Notes and Save button */}
                    <Card className="border-slate-200 shadow-xl shadow-slate-100 overflow-hidden rounded-2xl">
                        <CardContent className="p-4 bg-slate-50/30">
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <div className="flex-1 w-full relative">
                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <textarea 
                                        {...formik.getFieldProps('notes')} 
                                        className="w-full h-12 pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-monchito-purple/20 focus:border-monchito-purple outline-none transition-all resize-none bg-white font-medium" 
                                        placeholder="Notas adicionales de la guía..." 
                                    ></textarea>
                                </div>
                                {!isEditing ? (
                                    <AsyncButton 
                                        onClick={handleMainSave} 
                                        className="h-12 px-8 bg-monchito-purple hover:bg-monchito-purple/90 text-white font-black rounded-xl shadow-lg shadow-monchito-purple/20 transition-all flex items-center gap-2 whitespace-nowrap"
                                        isLoading={isSubmitting}
                                    >
                                        <Plus className="h-5 w-5" /> 
                                        Guardar Guía de Cambio
                                    </AsyncButton>
                                ) : (
                                    <AsyncButton 
                                        onClick={handlePrintReceipt} 
                                        className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                                        isLoading={isSubmitting}
                                    >
                                        <Printer className="h-5 w-5" /> 
                                        Imprimir Recibo
                                    </AsyncButton>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            <SourceOrderModal 
                isOpen={isSourceModalOpen}
                onClose={() => setIsSourceModalOpen(false)}
                clientId={formik.values.clientId}
                onSelect={(order) => {
                    setCurrentItem(prev => ({ 
                        ...prev, 
                        sourceOrderId: order.id,
                        sourceOrderNumber: order.orderNumber,
                        sourceBrandId: order.brandId || "",
                        sourceBrandName: order.brandName || order.brand?.name || "",
                        sourceQuantity: order.items?.[0]?.quantity || 1,
                        sourceDescription: order.notes || ""
                    }));
                }}
            />

            <ConfirmDialog 
                open={deleteConfirmOpen} 
                onOpenChange={setDeleteConfirmOpen} 
                title="Eliminar Pedido" 
                confirmText="Eliminar" 
                cancelText="Cancelar" 
                onConfirm={confirmDeleteOrder} 
                variant="destructive"
            >
                {orderToDelete && <p className="text-sm text-slate-600">¿Seguro de eliminar el pedido <strong>{orderToDelete.orderNumber}</strong> de <strong>{orderToDelete.brandName}</strong>?</p>}
            </ConfirmDialog>

            <PaymentModal
                open={paymentModalOpen}
                onOpenChange={setPaymentModalOpen}
                onSubmit={handlePaymentSubmit}
                paymentContext={{ 
                    type: "PEDIDO", 
                    clientId: formik.values.clientId, 
                    clientName: clients.find(c => c.id === formik.values.clientId)?.firstName || "Cliente", 
                    referenceNumber: formik.values.receiptNumber, 
                    description: "Guía de Cambio" 
                }}
                expectedAmount={totalRowDeposit > 0 ? totalRowDeposit : totalOrderValue}
                allowMultiplePayments={true}
                orderItems={formik.values.brandItems.map((item, idx) => ({ 
                    id: item.tempId || `item-${idx}`, 
                    brandName: item.brandName, 
                    total: Number(item.total), 
                    currentDeposit: Number(item.deposit || 0) 
                }))}
            />

            {pdfPreview.pdfDocument && (
                <PDFPreviewModal
                    open={pdfPreview.isOpen}
                    onOpenChange={(open) => { 
                        pdfPreview.closePreview(); 
                        if (!open && !isEditing) navigate('/exchanges'); 
                    }}
                    title={pdfTitle}
                    pdfDocument={pdfPreview.pdfDocument as any}
                    fileName={pdfFileName}
                    onDownload={pdfPreview.downloadPDF}
                    onPrint={pdfPreview.printPDF}
                />
            )}
        </>
    )
}
