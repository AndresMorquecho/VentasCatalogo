import { useState, useRef, useEffect, useMemo } from "react"
import { useFormik } from "formik"
import { useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import * as Yup from "yup"
import { 
    ArrowLeft, Plus, X, RotateCw, RefreshCw, 
    Edit2, Trash2, Printer, FileText, 
    AlertTriangle, Lock 
} from "lucide-react"

import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { AsyncButton } from "@/shared/ui/async-button"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Badge } from "@/shared/ui/badge"
import { PageHeader } from "@/shared/ui/PageHeader"

import { useCreateOrder, useUpdateOrder, useOrder, useReceiptOrders } from "@/entities/order/model/hooks"
import type { SalesChannel, OrderType } from "@/entities/order/model/types"
import { getPaidAmount } from "@/entities/order/model/model"
import { orderApi } from "@/entities/order/model/api"
import { useClientList } from "@/features/clients/api/hooks"
import { useBrandList } from "@/features/brands/api/hooks"
import { useBankAccountList } from "@/features/bank-accounts/api/hooks"
import { getActiveBrands } from "@/entities/brand/model/model"
import { useNotifications } from "@/shared/lib/notifications"
import { prepareOrderReceiptForPreview } from "@/features/order-receipt/lib/prepareOrderReceiptForPreview"
import { useClientCredits } from "@/features/transactions/model/hooks"
import { useAuth } from "@/shared/auth"
import { useCashClosurePreview } from "@/features/cash-closure/api/hooks"
import { PaymentModal, type PaymentModalData } from "@/shared/ui/PaymentModal"
import { usePDFPreview } from "@/shared/hooks/usePDFPreview"
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal"

const DRAFT_KEY = 'ventascatalogo_new_order_draft';
const ITEM_DRAFT_KEY = 'ventascatalogo_current_item_draft';

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
        })
    ).min(1, "Al menos una marca es requerida"),
    deposit: Yup.number()
        .min(0, "No negativo")
        .required("Requerido"),
    createdAt: Yup.string().required("Fecha de registro requerida"),
})

interface BrandItem {
    id?: string;
    tempId?: string;
    brandId: string;
    brandName: string;
    quantity: number;
    total: number;
    type: string;
    possibleDeliveryDate: string;
    orderNumber?: string;
    deposit?: number;
    notes?: string;
    salesChannel?: string;
    paymentMethod?: string;
    bankAccountId?: string;
    status?: string;
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

export function OrderFormPage() {
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
    
    const { data: bankAccountsResponse } = useBankAccountList()
    const bankAccounts = bankAccountsResponse?.data || []
    
    const createOrder = useCreateOrder()
    const { notifySuccess, notifyError } = useNotifications()
    const { user } = useAuth()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingReceiptNumber, setIsLoadingReceiptNumber] = useState(false)
    const [isLoadingOrderNumber, setIsLoadingOrderNumber] = useState(false)
    const [isLoadingRelated, setIsLoadingRelated] = useState(false)
    const [globalNextOrderNumber, setGlobalNextOrderNumber] = useState<string>("")
    
    // Estados para modal de edición individual
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [orderToEdit, setOrderToEdit] = useState<any>(null)
    const [editRowIndex, setEditRowIndex] = useState<number | null>(null)
    const [blockModalOpen, setBlockModalOpen] = useState(false)
    const [blockedClientInfo, setBlockedClientInfo] = useState<{ name: string, reason: string } | null>(null)
    
    // Estados para confirmación de eliminación
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [orderToDelete, setOrderToDelete] = useState<any>(null)
    const [lastClosureDate, setLastClosureDate] = useState<Date | null>(null)

    // Estados para modal de pago
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

    const getInitialCurrentItem = () => {
        if (!isEditing) {
            const savedItem = localStorage.getItem(ITEM_DRAFT_KEY);
            if (savedItem) {
                try {
                    return JSON.parse(savedItem);
                } catch(e) {
                    console.error("Error parsing current item draft", e);
                }
            }
        }
        return {
            brandId: "",
            brandName: "",
            quantity: 1,
            total: 0,
            type: "NORMAL" as OrderType,
            possibleDeliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            salesChannel: "OFICINA" as SalesChannel,
            orderNumber: "",
        };
    };

    // State for the item being added
    const [currentItem, setCurrentItem] = useState(getInitialCurrentItem())

    useEffect(() => {
        if (!isEditing) {
            localStorage.setItem(ITEM_DRAFT_KEY, JSON.stringify(currentItem));
        }
    }, [currentItem, isEditing]);




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
            // Si al menos un abono es > 0, significa que el usuario ingresó valores específicos
            // que deben preservarse sin redistribución automática
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
                    
                    // Aplicar redistribución proporcional automática SOLO cuando:
                    // 1. El usuario NO especificó abonos individuales (todos son $0)
                    // 2. Hay un monto total de pago mayor que cero
                    // Esto preserva los valores ingresados por el usuario cuando especifica abonos,
                    // mientras mantiene la funcionalidad de distribución automática para el caso
                    // donde todos los abonos son $0 y se ingresa un pago total en el modal
                    if (!hasUserSpecifiedDeposits && totalAmount > 0) {
                        const proportion = totalOrderValue > 0 ? Number(item.total) / totalOrderValue : 1 / formik.values.brandItems.length;
                        rowDeposit = Math.round(totalAmount * proportion * 100) / 100;
                    }
                    // Si hasUserSpecifiedDeposits === true, rowDeposit mantiene el valor del usuario
                    // sin redistribución, preservando exactamente lo que ingresó
                    
                    return {
                        brand_id: item.brandId,
                        brand_name: item.brandName,
                        total: item.total,
                        deposit: rowDeposit,
                        type: item.type,
                        possible_delivery_date: item.possibleDeliveryDate,
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

            // Invalidar queries en paralelo para evitar cascadas
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['orders'] }),
                queryClient.invalidateQueries({ queryKey: ['financial-records'] }),
                queryClient.invalidateQueries({ queryKey: ['transactions'] }),
                // Invalidate client wallet balance so it updates without refresh
                queryClient.invalidateQueries({ queryKey: ['client-credit', formik.values.clientId] }),
                queryClient.invalidateQueries({ queryKey: ['client-credits', formik.values.clientId] }),
                queryClient.invalidateQueries({ queryKey: ['client-credits-summary'] }),
                // This ensures the client list (which might show balances) is also updated
                queryClient.invalidateQueries({ queryKey: ['clients'] })
            ]);

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
                
                if (!isEditing) {
                    localStorage.removeItem(DRAFT_KEY);
                    localStorage.removeItem(ITEM_DRAFT_KEY);
                }
                // NO navegar automáticamente - dejar que el usuario vea el PDF primero
                // El usuario puede cerrar el modal y luego navegar manualmente
            } catch (pdfError) {
                console.error("Error preparing PDF", pdfError)
                notifyError(pdfError, "Error al preparar el recibo PDF.")
                // Si falla el PDF, navegar de todos modos
                notifySuccess(`Se han creado ${createdOrders.length} pedidos exitosamente.`);
                if (!isEditing) {
                    localStorage.removeItem(DRAFT_KEY);
                    localStorage.removeItem(ITEM_DRAFT_KEY);
                }
                navigate('/orders');
            }
        } catch (error: any) {
            console.error("Error saving order", error)
            notifyError(error, "Error al guardar el pedido.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const getInitialValues = () => {
        if (!isEditing) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    return {
                        ...parsed,
                        createdAt: new Date().toISOString().split('T')[0],
                        transactionDate: new Date().toISOString().split('T')[0]
                    };
                } catch(e) {
                    console.error("Error parsing order draft", e);
                }
            }
        }
        return {
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
        };
    };

    const formik = useFormik({
        initialValues: getInitialValues(),
        validationSchema,
        enableReinitialize: true,
        onSubmit: async () => {
            // Esta función ya no se usa directamente, el procesamiento se hace en handlePaymentSubmit
            // Se mantiene para compatibilidad con formik
        }
    })

    useEffect(() => {
        if (formik.submitCount > 0 && !formik.isValid) {
            console.log('Formik Errors:', formik.errors)
            notifyError(null, "Hay campos inválidos en el formulario. Por favor revisa los datos marcados.")
        }
    }, [formik.submitCount, formik.isValid])

    useEffect(() => {
        if (!isEditing) {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(formik.values));
        }
    }, [formik.values, isEditing]);

    const generateNextReceiptNumber = async () => {
        try {
            setIsLoadingReceiptNumber(true);
            const { receiptNumber } = await orderApi.generateReceiptNumber();
            formik.setFieldValue('receiptNumber', receiptNumber);
        } catch (error) {
            console.error('Error generating receipt number:', error);
            // Fallback manual si el backend falla o para previsualizar
            const year = new Date().getFullYear();
            formik.setFieldValue('receiptNumber', `OR-${year}-001`);
        } finally {
            setIsLoadingReceiptNumber(false);
        }
    };

    const generateNextOrderNumber = async () => {
        try {
            setIsLoadingOrderNumber(true);
            const { orderNumber } = await orderApi.generateOrderNumber();
            setGlobalNextOrderNumber(orderNumber);
            
            // Si el currentItem no tiene número o tiene el valor por defecto, actualizarlo
            if (!currentItem.orderNumber || currentItem.orderNumber.startsWith(`PD-${new Date().getFullYear()}`)) {
                setCurrentItem(prev => ({ ...prev, orderNumber: orderNumber }));
            }
        } catch (error) {
            console.error('Error generating order number:', error);
            const year = new Date().getFullYear();
            setGlobalNextOrderNumber(`PD-${year}-001`);
        } finally {
            setIsLoadingOrderNumber(false);
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

    // Función para validar si un pedido puede ser editado
    const canEditOrder = (order: any): { canEdit: boolean; reason?: string } => {
        // 1. Verificar cierre de caja
        if (lastClosureDate && order.transactionDate) {
            const transactionDate = new Date(order.transactionDate)
            if (transactionDate <= lastClosureDate) {
                return {
                    canEdit: false,
                    reason: 'No se puede editar: El periodo de caja ya está cerrado.'
                }
            }
        }

        // 2. Verificar estado del pedido
        if (order.status === 'RECIBIDO_EN_BODEGA') {
            return {
                canEdit: false,
                reason: 'No se puede editar: El pedido ya ha sido receptado en bodega.'
            }
        }
        
        if (order.status === 'ENTREGADO') {
            return {
                canEdit: false,
                reason: 'No se puede editar: El pedido ya ha sido entregado.'
            }
        }

        if (order.status && order.status !== 'POR_RECIBIR') {
            return {
                canEdit: false,
                reason: `No se puede editar: El pedido ya está en estado ${order.status}.`
            }
        }

        // 3. Verificar pagos múltiples del pedido ESPECÍFICO
        // Se permiten hasta 2 abonos si uno de ellos es 'CREDITO_CLIENTE' (abono inicial + saldo a favor)
        const payments = order.payments || [];
        const hasExtraPayments = payments.length > 2 || (payments.length > 1 && !payments.some((p: any) => p.method === 'CREDITO_CLIENTE'));
        
        if (hasExtraPayments) {
            return {
                canEdit: false,
                reason: 'No se puede editar este pedido: Ya tiene abonos adicionales vinculados.'
            }
        }

        return { canEdit: true }
    }

    // Función para validar si un pedido puede ser eliminado
    const canDeleteOrder = (order: any): { canDelete: boolean; reason?: string } => {
        const editValidation = canEditOrder(order)
        return {
            canDelete: editValidation.canEdit,
            reason: editValidation.reason
        }
    }

    // Función para validar si se puede agregar un nuevo item
    const canAddNewItem = (): { canEdit: boolean; reason?: string } => {
        // En modo edición, validar contra la fecha de creación del recibo (createdAt)
        // En modo creación, validar contra la fecha actual
        const dateToCheck = isEditing && formik.values.createdAt 
            ? new Date(formik.values.createdAt)
            : new Date()

        if (lastClosureDate && dateToCheck) {
            if (dateToCheck <= lastClosureDate) {
                return {
                    canEdit: false,
                    reason: 'No se puede agregar: El periodo de caja ya está cerrado para la fecha de este recibo.'
                }
            }
        }
        return { canEdit: true }
    }

    // Handler para abrir modal de edición
    const handleEditOrder = (order: any) => {
        const validation = canEditOrder(order)

        if (!validation.canEdit) {
            notifyError(null, validation.reason || 'No se puede editar este pedido individual')
            return
        }

        setOrderToEdit(order)
        const idx = formik.values.brandItems.findIndex((item: any) => (item.id && item.id === order.id) || (item.tempId && item.tempId === order.tempId))
        setEditRowIndex(idx >= 0 ? idx : null)
        setEditModalOpen(true)
    }

    // Handler para solicitar eliminación de un pedido
    const handleDeleteOrder = (order: any) => {
        const validation = canDeleteOrder(order)

        if (!validation.canDelete) {
            notifyError(null, validation.reason || 'No se puede eliminar este pedido')
            return
        }

        setOrderToDelete(order)
        setDeleteConfirmOpen(true)
    }

    // Confirmar y ejecutar la eliminación del pedido
    const confirmDeleteOrder = async () => {
        if (!orderToDelete) return

        try {
            await orderApi.delete(orderToDelete.id)
            
            // Invalidar las queries relacionadas en lugar de recargar la página
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            queryClient.invalidateQueries({ queryKey: ['order', orderToDelete.id] })
            queryClient.invalidateQueries({ queryKey: ['receiptOrders', orderToDelete.receiptNumber] })
            
            notifySuccess('Pedido eliminado correctamente.')
        } catch (error: any) {
            console.error('Error deleting order:', error)
            notifyError(error, 'Error al eliminar el pedido.')
        } finally {
            setDeleteConfirmOpen(false)
            setOrderToDelete(null)
        }
    }

    useEffect(() => {
        const year = new Date().getFullYear();
        const userPrefix = `PD-${year}-`;

        // REPROGRAMACION special handling: pre-select last brand and its number
        if (currentItem.type === 'REPROGRAMACION') {
            const lastValidItem = [...formik.values.brandItems].reverse().find(
                item => item.type === 'NORMAL' || item.type === 'PREVENTA'
            );
            
            if (lastValidItem) {
                // Si ya teníamos una marca pero no era la última válida, o si no teníamos marca, la actualizamos
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

        // No forzar el mismo número para la misma marca. Cada fila debe tener su propio número correlativo.


        // Default: calculate next global number for the current receipt
        const numbersInList = formik.values.brandItems
            .map(item => item.orderNumber)
            .filter(num => num && num.startsWith(userPrefix));
        
        const uniqueNumbersCount = new Set(numbersInList).size;
        
        let nextNum = "";
        if (uniqueNumbersCount > 0) {
            // Incrementar sobre lo que ya hay en la tabla
            nextNum = `${userPrefix}${String(uniqueNumbersCount + 1).padStart(3, '0')}`;
        } else if (globalNextOrderNumber) {
            // Usar el número global del servidor si la tabla está vacía
            nextNum = globalNextOrderNumber;
        } else {
            // Fallback
            nextNum = `${userPrefix}001`;
        }
        
        // Only update if it's currently empty or has the default pattern but an old count
        const isCurrentDefault = !currentItem.orderNumber || currentPrefixMatch(currentItem.orderNumber, userPrefix);
        if (isCurrentDefault && currentItem.orderNumber !== nextNum && currentItem.type !== 'REPROGRAMACION') {
            setCurrentItem(prev => ({ ...prev, orderNumber: nextNum }));
        }
    }, [currentItem.brandId, currentItem.type, formik.values.brandItems.length, globalNextOrderNumber]);

    // Helper to check if a number matches the pattern prefix
    function currentPrefixMatch(val: string, prefix: string) {
        return val.startsWith(prefix);
    }


    // Update formik when order data is loaded for editing - Load all associated items
    useEffect(() => {
        const loadAllItems = async () => {
            // Caso 1: Carga por receiptNumber (múltiples pedidos)
            if (receiptNumber && !isLoadingReceiptOrders) {
                if (receiptOrders && receiptOrders.length > 0) {
                    setIsLoadingRelated(true);
                    try {
                        const allItems = receiptOrders;
                        const firstOrder = allItems[0];

                        const parentOrderNumber = allItems.find(item => 
                            item.type === 'NORMAL' || item.type === 'PREVENTA'
                        )?.orderNumber || "";

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
                        console.error("Error loading receipt orders", err);
                        notifyError(null, "No se pudieron cargar todos los pedidos del recibo.");
                    } finally {
                        setIsLoadingRelated(false);
                    }
                } else if (receiptOrders !== undefined) {
                    // receiptOrders está definido pero vacío - no hay pedidos para este recibo
                    console.warn(`No se encontraron pedidos para el recibo: ${receiptNumber}`);
                    // No mostrar error aquí, dejar que el usuario vea la página vacía
                }
            }
            // Caso 2: Carga por ID individual (un solo pedido, luego busca relacionados)
            else if (order && id) {
                setIsLoadingRelated(true);
                try {
                    // Fetch all orders sharing the same receipt number
                    const response = await orderApi.getAll({ search: order.receiptNumber, limit: 100 });
                    const allItems = (response as any).data || (Array.isArray(response) ? response : [order]);

                    // Encontrar el orderNumber de un pedido NORMAL o PREVENTA para las reprogramaciones
                    const parentOrderNumber = allItems.find((item: any) => 
                        item.type === 'NORMAL' || item.type === 'PREVENTA'
                    )?.orderNumber || "";

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
                    console.error("Error loading related orders", err);
                    notifyError(null, "No se pudieron cargar todos los pedidos del recibo.");
                } finally {
                    setIsLoadingRelated(false);
                }
            }
            // Caso 3: Modo creación
            else if (!isEditing) {
                generateNextReceiptNumber();
                generateNextOrderNumber();
            }
        };

        loadAllItems();
    }, [order, receiptOrders, isEditing, id, receiptNumber, isLoadingReceiptOrders, isLoadingOrder]);

    const { data: creditsResponse } = useClientCredits(formik.values.clientId)
    const credits = Array.isArray(creditsResponse) ? creditsResponse : (creditsResponse as any)?.data || []
    const totalCredit = credits.reduce((sum: number, c: any) => sum + Number(c.remainingAmount || 0), 0)

    // Obtener fecha del último cierre de caja
    const { data: closurePreview } = useCashClosurePreview()
    
    useEffect(() => {
        if (closurePreview?.lastClosureDate) {
            setLastClosureDate(new Date(closurePreview.lastClosureDate))
        }
    }, [closurePreview])

    // Total order value remains the same
    const totalOrderValue = formik.values.brandItems.reduce((sum, item) => sum + Number(item.total), 0);

    // Total deposit is now the sum of manual row deposits
    const totalRowDeposit = formik.values.brandItems.reduce((sum, item) => sum + Number(item.deposit || 0), 0);

    const handleHeaderKeyDown = (e: React.KeyboardEvent, fieldName: string) => {
        const fields = [
            'receiptNumber', 'createdAt', 'clientId',
            'salesChannel', 'type', 'orderNumber', 'quantity', 
            'brandId', 'total', 'possibleDeliveryDate', 'addButton'
        ];
        const currentIndex = fields.indexOf(fieldName);

        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const isInput = e.currentTarget.tagName === 'INPUT';
            const isSelect = e.currentTarget.tagName === 'SELECT';
            
            let selectionAtBoundary = true;
            if (isInput) {
                const input = e.currentTarget as HTMLInputElement;
                try {
                    // Try to get selection, if supported by the input type
                    if (input.selectionStart !== null) {
                        if (e.key === 'ArrowRight') {
                            selectionAtBoundary = input.selectionStart === input.value.length;
                        } else {
                            selectionAtBoundary = input.selectionStart === 0;
                        }
                    } else if (input.type === 'date' || input.type === 'number') {
                        // For date/number where we can't reliably get cursor position, 
                        // we don't jump with arrows to avoid breaking internal navigation 
                        // (like moving between day/month/year). Only TAB should jump here
                        // unless the field is empty.
                        selectionAtBoundary = false; 
                    }
                } catch(err) {
                    selectionAtBoundary = false;
                }
            } else if (isSelect) {
                // Selects don't have internal cursor, so they always jump
                selectionAtBoundary = true;
            }

            if (selectionAtBoundary) {
                const direction = e.key === 'ArrowRight' ? 1 : -1;
                const nextIndex = currentIndex + direction;
                if (nextIndex >= 0 && nextIndex < fields.length) {
                    e.preventDefault();
                    const target = document.querySelector(`[data-nav="${fields[nextIndex]}"]`) as HTMLElement;
                    if (target) {
                        target.focus();
                        if (target instanceof HTMLInputElement && target.type !== 'number' && target.type !== 'date') {
                            target.select();
                        }
                    }
                }
            }
        }

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const jumps: Record<string, string> = {
                'receiptNumber': 'salesChannel',
                'createdAt': 'orderNumber',
                'clientId': 'brandId',
                'salesChannel': 'receiptNumber',
                'orderNumber': 'createdAt',
                'brandId': 'clientId',
                'quantity': 'receiptNumber',
                'total': 'createdAt',
                'possibleDeliveryDate': 'clientId'
            };
            
            const targetName = jumps[fieldName];
            if (targetName) {
                e.preventDefault();
                const target = document.querySelector(`[data-nav="${targetName}"]`) as HTMLElement;
                if (target) target.focus();
            }
        }
    };

    const handleTableKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, fieldName: string) => {
        const input = e.currentTarget;
        let selectionAtBoundary = false;
        
        try {
            if (input.selectionStart !== null) {
                if (e.key === 'ArrowRight') selectionAtBoundary = input.selectionStart === input.value.length;
                else if (e.key === 'ArrowLeft') selectionAtBoundary = input.selectionStart === 0;
            } else if (input.type === 'number') {
                // For number inputs, jump only if empty or if we want to force it.
                // But the user wants traversal, so we can't jump if we don't know position.
                selectionAtBoundary = false;
            }
        } catch(e) {}

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const direction = e.key === 'ArrowDown' ? 1 : -1;
            const targetRowIndex = rowIndex + direction;
            if (targetRowIndex >= 0 && targetRowIndex < formik.values.brandItems.length) {
                const targetInput = document.querySelector(`[data-row-index="${targetRowIndex}"][data-field-name="${fieldName}"]`) as HTMLInputElement;
                if (targetInput) {
                    targetInput.focus();
                    if (targetInput.type !== 'number') targetInput.select();
                }
            }
        } else if (e.key === 'ArrowLeft' && selectionAtBoundary) {
            const fields = ['orderNumber', 'total', 'deposit'];
            const currentIndex = fields.indexOf(fieldName);
            if (currentIndex > 0) {
                const targetInput = document.querySelector(`[data-row-index="${rowIndex}"][data-field-name="${fields[currentIndex - 1]}"]`) as HTMLInputElement;
                if (targetInput) {
                    e.preventDefault();
                    targetInput.focus();
                    if (targetInput.type !== 'number') targetInput.select();
                }
            }
        } else if (e.key === 'ArrowRight' && selectionAtBoundary) {
            const fields = ['orderNumber', 'total', 'deposit'];
            const currentIndex = fields.indexOf(fieldName);
            if (currentIndex < fields.length - 1) {
                const targetInput = document.querySelector(`[data-row-index="${rowIndex}"][data-field-name="${fields[currentIndex + 1]}"]`) as HTMLInputElement;
                if (targetInput) {
                    e.preventDefault();
                    targetInput.focus();
                    if (targetInput.type !== 'number') targetInput.select();
                }
            }
        }
    };

    // Balance calculation
    const balance = totalOrderValue - totalRowDeposit - Number(formik.values.creditToUse);


    const clientOptions = clients.map(c => ({ id: c.id, label: c.firstName, subLabel: c.identificationNumber }))
    const brandOptions = getActiveBrands(brands).map(b => ({ id: b.id, label: b.name, subLabel: "" }))

    const handleAddItem = async () => {
        if (!currentItem.brandId) {
            notifyError(null, "Seleccione una marca");
            return;
        }
        if (currentItem.total < 0) {
            notifyError(null, "El valor no puede ser negativo");
            return;
        }

        // Validar cierre de caja
        const validation = canAddNewItem()
        if (!validation.canEdit) {
            notifyError(null, validation.reason || 'No se puede agregar')
            return
        }

        // Si estamos en modo edición, hacer POST directo del nuevo pedido
        if (isEditing) {
            try {
                setIsSubmitting(true)

                // Preparar los items a crear (puede ser múltiples si es REPROGRAMACION)
                const itemsToCreate = currentItem.type === 'REPROGRAMACION' && currentItem.quantity > 1
                    ? Array.from({ length: currentItem.quantity }).map(() => ({
                        ...currentItem,
                        quantity: 1,
                        total: Number((currentItem.total / currentItem.quantity).toFixed(2)),
                    }))
                    : [currentItem]

                // Obtener el parentOrderId del primer pedido existente
                const firstExistingOrder = formik.values.brandItems.find((item: any) => item.id)
                const parentOrderId = firstExistingOrder?.id || null

                // Obtener el nombre del cliente
                const client = clients.find(c => c.id === formik.values.clientId);
                const clientName = client ? client.firstName : "Desconocido";

                // Crear cada nuevo pedido
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
                        notes: formik.values.notes,
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
                        deposit: 0, // Nuevo pedido sin abono inicial
                        creditToUse: 0,
                        parentOrderId: parentOrderId || undefined,
                        orderNumber: itemToCreate.orderNumber?.trim() || undefined
                    }

                    await createOrder.mutateAsync(payload as any)
                }

                // Invalidar queries para recargar los datos
                queryClient.invalidateQueries({ queryKey: ['orders'] })
                queryClient.invalidateQueries({ queryKey: ['receiptOrders', formik.values.receiptNumber] })

                notifySuccess(`${itemsToCreate.length} pedido(s) agregado(s) correctamente.`)

                // Reset item
                setCurrentItem(prev => ({
                    ...prev,
                    brandId: "",
                    brandName: "",
                    total: 0,
                    quantity: 1,
                    orderNumber: ""
                }))
            } catch (error: any) {
                console.error('Error adding new order:', error)
                notifyError(error, 'Error al agregar el pedido.')
            } finally {
                setIsSubmitting(false)
            }
        } else {
            // Modo creación: agregar a la tabla local
            const baseId = crypto.randomUUID();
            if (currentItem.type === 'REPROGRAMACION' && currentItem.quantity > 1) {
                const newItems = Array.from({ length: currentItem.quantity }).map(() => ({
                    ...currentItem,
                    tempId: crypto.randomUUID(),
                    quantity: 1,
                    total: Number((currentItem.total / currentItem.quantity).toFixed(2)),
                    deposit: 0
                }));
                formik.setFieldValue("brandItems", [...formik.values.brandItems, ...newItems]);
            } else {
                formik.setFieldValue("brandItems", [...formik.values.brandItems, { 
                    ...currentItem, 
                    tempId: baseId,
                    deposit: 0 
                }]);
            }

            // Reset item except channel and date for speed
            setCurrentItem(prev => ({
                ...prev,
                brandId: "",
                brandName: "",
                total: 0,
                quantity: 1,
                orderNumber: ""
            }));
        }
    }

    const removeItem = (index: number) => {
        const itemToRemove = formik.values.brandItems[index];
        
        // If it's an existing order with ID, we should probably warn or handle it differently
        // but the table already has a Delete button that calls handleDeleteOrder for those.
        // This removeItem is for local rows only.
        if (isEditing && itemToRemove.id) {
            handleDeleteOrder(itemToRemove);
            return;
        }

        const items = formik.values.brandItems.filter((_, i) => i !== index);
        formik.setFieldValue("brandItems", items);
    }

    // Función para imprimir el recibo en modo edición
    const handlePrintReceipt = async () => {
        try {
            setIsSubmitting(true)

            // Obtener todos los pedidos del recibo actual
            const allOrders = formik.values.brandItems.filter((item: any) => item.id)

            if (allOrders.length === 0) {
                notifyError(null, 'No hay pedidos para imprimir.')
                return
            }

            // Obtener el cliente
            const client = clients.find((c: any) => c.id === formik.values.clientId)

            if (!client) {
                notifyError(null, 'No se encontró información del cliente.')
                return
            }

            // Generar el PDF Preview
            try {
                const { document, fileName, title } = await prepareOrderReceiptForPreview(
                    allOrders[0],
                    {
                        id: user?.id || '1',
                        name: user?.username || 'Vendedor',
                        role: 'OPERATOR',
                        email: '',
                    } as any,
                    allOrders.slice(1)
                )
                
                setPdfTitle(title)
                setPdfFileName(fileName)
                pdfPreview.openPreview(document)
                
                notifySuccess('Recibo preparado para visualización.')
            } catch (pdfError) {
                console.error('Error preparing PDF:', pdfError)
                notifyError(pdfError, 'Error al preparar el recibo.')
            }
        } catch (error: any) {
            console.error('Error generating PDF:', error)
            notifyError(error, 'Error al generar el recibo.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if ((isEditing && (isLoadingOrder || isLoadingReceiptOrders)) || isLoadingRelated) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <RefreshCw className="h-10 w-10 animate-spin text-slate-800" />
                <p className="text-slate-500 font-medium animate-pulse">Cargando todos los pedidos del recibo...</p>
            </div>
        )
    }

    const handleMainSave = async () => {
        // Validar que hay items agregados
        if (formik.values.brandItems.length === 0) {
            notifyError(null, "Debe agregar al menos una marca al pedido.");
            return;
        }

        // Mostrar errores de validación si existen
        if (Object.keys(formik.errors).length > 0) {
            const firstError = Object.values(formik.errors)[0]
            if (typeof firstError === 'string') {
                notifyError(null, firstError)
            } else if (Array.isArray(firstError)) {
                const itemErrors = firstError.filter(e => e !== undefined)
                if (itemErrors.length > 0) {
                    const firstItemError = itemErrors[0]
                    if (typeof firstItemError === 'object') {
                        const errorMsg = Object.values(firstItemError)[0]
                        notifyError(null, `Error en fila: ${errorMsg}`)
                    }
                }
            }
            return
        }

        // Validar número de recibo
        if (!isEditing) {
            const isValidReceipt = await validateReceiptNumber(formik.values.receiptNumber);
            if (!isValidReceipt) {
                return;
            }
        }

        // Abrir modal de pago (sin validación de distribución)
        setPaymentModalOpen(true)
    }

    return (
        <div className="space-y-4 pb-12">
            {/* Header Toolbar */}
            <PageHeader
                title={isEditing ? "Editar Pedido" : "Registro de Pedidos"}
                description={isEditing ? "Modifica los datos del pedido existente" : "Crea un nuevo recibo con uno o varios catálogos"}
                icon={FileText}
                actions={
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigate('/orders')}
                        className="text-monchito-purple hover:bg-monchito-purple/10 rounded-lg font-bold text-sm"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Pedidos
                    </Button>
                }
            />

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Column 1: Client & General Info */}
                <Card className="lg:col-span-3 shadow-sm border-slate-200 bg-white rounded-2xl">
                    <CardHeader className="py-2 px-4 bg-monchito-purple/5 border-b border-monchito-purple/10 rounded-t-2xl">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-monchito-purple">Encabezado Recibo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-600">No de recibo:</Label>
                                <div className="flex gap-1">
                                    <Input
                                        {...formik.getFieldProps('receiptNumber')}
                                        disabled={isLoadingReceiptNumber || isEditing}
                                        onKeyDown={e => handleHeaderKeyDown(e, 'receiptNumber')}
                                        data-nav="receiptNumber"
                                        className="h-8 text-sm font-mono font-bold text-monchito-purple bg-monchito-purple/5"
                                    />
                                    {!isEditing && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                generateNextReceiptNumber();
                                                generateNextOrderNumber();
                                            }}
                                            disabled={isLoadingReceiptNumber || isLoadingOrderNumber}
                                            className="h-8 w-8 text-monchito-purple hover:bg-monchito-purple/10 rounded-lg"
                                            title="Actualizar índices"
                                        >
                                            <RotateCw className={`h-3 w-3 ${isLoadingReceiptNumber || isLoadingOrderNumber ? 'animate-spin' : ''}`} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 pb-0.5">
                                    <Label className="text-xs font-bold text-slate-600">Fecha de Registro:</Label>
                                </div>
                                <div className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 flex items-center px-3 gap-2">
                                    <Lock className="h-3 w-3 text-slate-400" />
                                    <span className="text-sm font-semibold text-slate-500">
                                        {formik.values.createdAt}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-600">Empresaria / Cliente:</Label>
                                <SearchableSelect
                                    options={clientOptions}
                                    value={formik.values.clientId}
                                    onChange={(val) => {
                                        const client = clients.find((c: any) => c.id === val);
                                        if (client?.isBlocked) {
                                            setBlockedClientInfo({ 
                                                name: client.firstName, 
                                                reason: client.blockedReason || 'El cliente ha sido bloqueado por desmantelamiento de pedidos previos o comportamiento irregular.' 
                                            });
                                            setBlockModalOpen(true);
                                        }
                                        formik.setFieldValue('clientId', val);
                                    }}
                                    placeholder="Ingrese nombre o cédula..."
                                    disabled={isEditing}
                                    onKeyDownNavigation={e => handleHeaderKeyDown(e, 'clientId')}
                                    navId="clientId"
                                />
                                {totalCredit > 0 && (
                                    <p className="text-xs text-green-600 font-bold mt-1">Saldo a favor: ${totalCredit.toFixed(2)}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Column 2: Quick Summary Totals */}
                <Card className="shadow-sm border-slate-200 bg-white rounded-2xl">
                    <CardHeader className="py-2 px-4 bg-monchito-purple/5 border-b border-monchito-purple/10 rounded-t-2xl">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-monchito-purple">Valores</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500">Total pedidos:</span>
                            <span className="font-bold text-slate-900">${totalOrderValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-green-700">
                            <span className="font-bold">Total abono:</span>
                            <span className="font-bold">${(totalRowDeposit + Number(formik.values.creditToUse)).toFixed(2)}</span>
                        </div>
                        <Separator className="my-1" />
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase text-slate-400">Saldo:</span>
                            <span className={`text-xl font-black ${balance > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                ${balance.toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Item Entry Bar & Table */}
            <Card className="shadow-sm border-slate-200 rounded-2xl">
                <div className="p-3 bg-monchito-purple/5 border-b border-monchito-purple/10 flex flex-wrap lg:flex-nowrap gap-3 items-end">
                    <div className="w-full sm:w-[110px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">Pedido por:</Label>
                        <select
                            value={currentItem.salesChannel}
                            onChange={(e) => setCurrentItem({ ...currentItem, salesChannel: e.target.value as SalesChannel })}
                            onKeyDown={e => handleHeaderKeyDown(e, 'salesChannel')}
                            data-nav="salesChannel"
                            className="h-8 w-full rounded-md border border-input text-xs px-2 py-1 focus:ring-1 focus:ring-monchito-purple outline-none"
                        >
                            <option value="OFICINA">OFICINA</option>
                            <option value="WHATSAPP">WHATSAPP</option>
                            <option value="DE CAMPO">DE CAMPO</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-[130px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">Tipo:</Label>
                        <select
                            value={currentItem.type}
                            onChange={(e) => setCurrentItem({ ...currentItem, type: e.target.value as OrderType })}
                            onKeyDown={e => handleHeaderKeyDown(e, 'type')}
                            data-nav="type"
                            className="h-8 w-full rounded-md border border-input text-xs px-2 py-1 focus:ring-1 focus:ring-monchito-purple outline-none"
                        >
                            <option value="NORMAL">NORMAL</option>
                            <option value="PREVENTA">PREVENTA</option>
                            <option value="REPROGRAMACION">REPROGRAMACION</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-[110px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">No Pedido:</Label>
                        <Input
                            className="h-8 w-full text-xs font-mono px-2"
                            value={currentItem.orderNumber}
                            onChange={(e) => setCurrentItem({ ...currentItem, orderNumber: e.target.value })}
                            onKeyDown={e => handleHeaderKeyDown(e, 'orderNumber')}
                            data-nav="orderNumber"
                            placeholder="Ej: 12345"
                        />
                    </div>
                    <div className="w-full sm:w-[60px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">Cant:</Label>
                        <Input
                            type="number"
                            className="h-8 w-full text-xs px-2 hide-spinner"
                            value={currentItem.quantity}
                            onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                            onKeyDown={e => handleHeaderKeyDown(e, 'quantity')}
                            data-nav="quantity"
                        />
                    </div>
                    <div className="w-full sm:flex-1 min-w-[140px] space-y-1">
                        <Label className="text-xs font-bold uppercase text-slate-500">Catálogo / Marca:</Label>
                        <SearchableSelect
                            options={brandOptions}
                            value={currentItem.brandId}
                            onChange={(val) => {
                                const b = brands.find(x => x.id === val);
                                setCurrentItem({ ...currentItem, brandId: val, brandName: b ? b.name : "" });
                            }}
                            placeholder="Marca..."
                            onKeyDownNavigation={e => handleHeaderKeyDown(e, 'brandId')}
                            navId="brandId"
                        />
                    </div>
                    <div className="w-full sm:w-[80px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">Valor:</Label>
                        <Input
                            type="number"
                            className="h-8 w-full font-bold text-xs px-2 hide-spinner"
                            value={currentItem.total}
                            onChange={(e) => setCurrentItem({ ...currentItem, total: Number(e.target.value) })}
                            onKeyDown={e => handleHeaderKeyDown(e, 'total')}
                            data-nav="total"
                            step="0.01"
                        />
                    </div>
                    <div className="w-full sm:w-[155px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">Entrega:</Label>
                        <Input
                            type="date"
                            className="h-9 w-full text-xs px-2 font-medium"
                            value={currentItem.possibleDeliveryDate}
                            onChange={(e) => setCurrentItem({ ...currentItem, possibleDeliveryDate: e.target.value })}
                            onKeyDown={e => handleHeaderKeyDown(e, 'possibleDeliveryDate')}
                            data-nav="possibleDeliveryDate"
                        />
                    </div>
                    <div className="w-full sm:w-[130px] shrink-0">
                        <Button
                            type="button"
                            onClick={handleAddItem}
                            onKeyDown={e => handleHeaderKeyDown(e, 'addButton')}
                            data-nav="addButton"
                            className="h-8 w-full bg-monchito-purple hover:bg-monchito-purple/90 px-3 text-xs font-bold transition-all rounded-lg"
                        >
                            <Plus className="h-3 w-3 mr-1.5" /> Agregar
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Desktop and Mobile Wrapper */}
                    {/* Desktop View Table */}
                    <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="bg-monchito-purple/5 border-b border-monchito-purple/10">
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-center w-8 text-[10px] font-black text-monchito-purple uppercase tracking-widest">N°</th>
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Pedido Por</th>
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">N° Pedido</th>
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Tipo</th>
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Catálogo</th>
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-center text-[10px] font-black text-monchito-purple uppercase tracking-widest">Cant</th>
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Valor Pedido</th>
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Abono</th>
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-right text-[10px] font-black text-monchito-purple uppercase tracking-widest">Saldo</th>
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Posible Entrega</th>
                                    <th className="px-2 py-3 text-center w-20 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {formik.values.brandItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-8 text-center text-slate-400 italic text-xs">No hay marcas agregadas en este recibo</td>
                                    </tr>
                                ) : (
                                    formik.values.brandItems.map((item: BrandItem, idx: number) => {
                                        const distributedAbono = Number(item.deposit || 0);
                                        const rowSaldo = Number(item.total) - distributedAbono;

                                        return (
                                            <tr 
                                                key={item.id || item.tempId || idx} 
                                                className="hover:bg-monchito-purple/5 transition-all duration-200 border-b border-slate-50 last:border-0"
                                            >
                                                <td className="px-2 py-2 border-r border-slate-50 text-center text-xs font-bold text-slate-400">{idx + 1}</td>
                                                
                                                {/* Pedido por */}
                                                <td className="px-2 py-2 border-r border-slate-50">
                                                    <Badge variant="outline" className="text-[9px] font-black px-2 py-0.5 border-slate-200 text-slate-500 uppercase tracking-wider rounded-lg">
                                                        {item.salesChannel || "OFICINA"}
                                                    </Badge>
                                                </td>

                                                {/* N° Pedido */}
                                                <td className="px-2 py-2 border-r border-slate-50">
                                                    {!isEditing ? (
                                                        <Input
                                                            value={item.orderNumber || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...formik.values.brandItems]
                                                                newItems[idx] = { ...newItems[idx], orderNumber: e.target.value }
                                                                formik.setFieldValue('brandItems', newItems)
                                                            }}
                                                            onKeyDown={(e) => handleTableKeyDown(e, idx, 'orderNumber')}
                                                            data-row-index={idx}
                                                            data-field-name="orderNumber"
                                                            placeholder="---"
                                                            className="h-7 text-xs font-mono px-1 border-slate-200"
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-bold text-monchito-purple">{item.orderNumber || '---'}</span>
                                                    )}
                                                </td>

                                                {/* Tipo */}
                                                <td className="px-2 py-2 border-r border-slate-50">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                        item.type === 'NORMAL' ? 'bg-blue-50 text-blue-600' :
                                                        item.type === 'PREVENTA' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-purple-50 text-purple-600'
                                                    }`}>
                                                        {item.type}
                                                    </span>
                                                </td>

                                                {/* Catálogo */}
                                                <td className="px-2 py-2 border-r border-slate-50">
                                                    <span className="text-xs font-bold text-slate-800 truncate block" title={item.brandName}>{item.brandName}</span>
                                                </td>

                                                {/* Cantidad */}
                                                <td className="px-2 py-2 border-r border-slate-50 text-center text-xs font-bold text-slate-700">
                                                    {item.quantity}
                                                </td>

                                                <td className="px-2 py-2 border-r border-slate-50 text-right">
                                                    {!isEditing ? (
                                                        <div className="flex justify-end items-center gap-1">
                                                            <span className="text-slate-400 text-xs">$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="h-7 w-16 text-right text-xs font-bold border border-slate-200 rounded-lg px-1 focus:ring-1 focus:ring-monchito-purple outline-none hide-spinner"
                                                                value={item.total}
                                                                onChange={(e) => {
                                                                    const newItems = [...formik.values.brandItems]
                                                                    newItems[idx] = { ...newItems[idx], total: Number(e.target.value) }
                                                                    formik.setFieldValue('brandItems', newItems)
                                                                }}
                                                                onKeyDown={(e) => handleTableKeyDown(e as any, idx, 'total')}
                                                                data-row-index={idx}
                                                                data-field-name="total"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-800">${Number(item.total).toFixed(2)}</span>
                                                    )}
                                                </td>

                                                <td className="px-2 py-2 border-r border-slate-50 text-right">
                                                    {!isEditing ? (
                                                        <div className="flex justify-end items-center gap-1">
                                                            <span className="text-emerald-500 text-xs">$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max={item.total}
                                                                placeholder="0.00"
                                                                className="h-7 w-16 text-right text-xs font-bold border border-slate-200 rounded-lg px-1 focus:ring-1 focus:ring-emerald-500 outline-none text-emerald-600 hide-spinner"
                                                                value={item.deposit === 0 ? '0' : (item.deposit || '')}
                                                                onChange={(e) => {
                                                                    const newItems = [...formik.values.brandItems];
                                                                    const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                    newItems[idx] = { ...newItems[idx], deposit: value };
                                                                    formik.setFieldValue('brandItems', newItems);
                                                                }}
                                                                onKeyDown={(e) => handleTableKeyDown(e as any, idx, 'deposit')}
                                                                data-row-index={idx}
                                                                data-field-name="deposit"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-bold text-emerald-600">${distributedAbono.toFixed(2)}</span>
                                                    )}
                                                </td>

                                                <td className="px-2 py-2 border-r border-slate-50 text-right">
                                                    <span className={`text-xs font-bold ${rowSaldo > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                        ${rowSaldo.toFixed(2)}
                                                    </span>
                                                </td>

                                                <td className="px-2 py-2 border-r border-slate-50">
                                                    {!isEditing ? (
                                                        <input
                                                            type="date"
                                                            className="h-7 w-full text-xs border border-slate-200 rounded-lg px-2 pr-8 font-medium"
                                                            value={item.possibleDeliveryDate}
                                                            onChange={(e) => {
                                                                const newItems = [...formik.values.brandItems]
                                                                newItems[idx] = { ...newItems[idx], possibleDeliveryDate: e.target.value }
                                                                formik.setFieldValue('brandItems', newItems)
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-medium text-slate-600">{new Date(item.possibleDeliveryDate).toLocaleDateString()}</span>
                                                    )}
                                                </td>

                                                <td className="px-2 py-1.5 text-center">
                                                    <div className="flex justify-center gap-1">
                                                        {isEditing && item.id ? (
                                                            <>
                                                                <Button 
                                                                    type="button"
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => handleEditOrder(item)} 
                                                                    className="h-6 w-6 text-blue-600 hover:text-blue-700"
                                                                    aria-label="Editar pedido"
                                                                    data-testid={`edit-order-${idx}`}
                                                                >
                                                                    <Edit2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button 
                                                                    type="button"
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => handleDeleteOrder(item)} 
                                                                    className="h-6 w-6 text-red-500 hover:text-red-700"
                                                                    aria-label={`Eliminar pedido de ${item.brandName}`}
                                                                    data-testid={`delete-order-${idx}`}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </>
                                                        ) : !isEditing ? (
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-6 w-6 text-red-500 hover:text-red-700">
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    {/* Mobile View Cards */}
                    <div className="lg:hidden space-y-4">
                        {formik.values.brandItems.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 overflow-hidden">
                                <p className="text-slate-400 italic text-xs">No hay pedidos agregados en este recibo</p>
                            </div>
                        ) : (
                            formik.values.brandItems.map((item: any, idx: number) => {
                                const distributedAbono = Number(item.deposit || 0);
                                const rowSaldo = Number(item.total) - distributedAbono;

                                return (
                                    <div key={item.id || item.tempId || idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{idx + 1}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                        item.type === 'NORMAL' ? 'bg-blue-50 text-blue-600' :
                                                        item.type === 'PREVENTA' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-purple-50 text-purple-600'
                                                    }`}>
                                                        {item.type}
                                                    </span>
                                                </div>
                                                <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight line-clamp-1">{item.brandName}</h3>
                                                <p className="text-xs font-mono font-bold text-monchito-purple">{item.orderNumber || '---'}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                {!isEditing ? (
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => removeItem(idx)} 
                                                        className="h-8 w-8 text-red-500 bg-red-50/50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleEditOrder(item)} 
                                                        className="h-8 w-8 text-blue-600 bg-blue-50/50"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Valor Pedido</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                                    <Input
                                                        type="number"
                                                        className="h-10 pl-6 text-sm font-black rounded-xl border-slate-100 bg-slate-50/50"
                                                        value={item.total}
                                                        disabled={isEditing}
                                                        onChange={(e) => {
                                                            const newItems = [...formik.values.brandItems]
                                                            newItems[idx] = { ...newItems[idx], total: Number(e.target.value) }
                                                            formik.setFieldValue('brandItems', newItems)
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Abono</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs">$</span>
                                                    <Input
                                                        type="number"
                                                        className="h-10 pl-6 text-sm font-black rounded-xl border-emerald-100 bg-emerald-50/30 text-emerald-700"
                                                        value={item.deposit}
                                                        disabled={isEditing}
                                                        onChange={(e) => {
                                                            const newItems = [...formik.values.brandItems]
                                                            newItems[idx] = { ...newItems[idx], deposit: Number(e.target.value) }
                                                            formik.setFieldValue('brandItems', newItems)
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</span>
                                            <span className={`text-sm font-black ${rowSaldo > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                ${rowSaldo.toFixed(2)}
                                            </span>
                                        </div>

                                        {!isEditing && (
                                            <div className="space-y-1">
                                                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Posible Entrega</Label>
                                                <Input
                                                    type="date"
                                                    className="h-10 text-sm font-bold rounded-xl border-slate-100 bg-white"
                                                    value={item.possibleDeliveryDate}
                                                    onChange={(e) => {
                                                        const newItems = [...formik.values.brandItems]
                                                        newItems[idx] = { ...newItems[idx], possibleDeliveryDate: e.target.value }
                                                        formik.setFieldValue('brandItems', newItems)
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </Card>

            {/* Bottom Section: Notes + Save */}
            <Card className="shadow-sm border-slate-200 rounded-2xl">
                <CardContent className="p-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <textarea
                            {...formik.getFieldProps('notes')}
                            className="flex-1 h-12 p-2 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-monchito-purple outline-none resize-none"
                            placeholder="Notas adicionales sobre el pedido..."
                        />
                        {!isEditing ? (
                            <AsyncButton
                                type="button"
                                onClick={handleMainSave}
                                className="shrink-0 bg-monchito-purple hover:bg-monchito-purple/90 font-bold px-8"
                                isLoading={isSubmitting}
                            >
                                <Plus className="h-4 w-4 mr-2" /> 
                                Guardar Recibo
                            </AsyncButton>
                        ) : (
                            <AsyncButton
                                type="button"
                                onClick={handlePrintReceipt}
                                className="shrink-0 bg-monchito-purple hover:bg-monchito-purple/90 font-bold px-8"
                                isLoading={isSubmitting}
                            >
                                <Printer className="h-4 w-4 mr-2" /> Imprimir Recibo
                            </AsyncButton>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Diálogo de confirmación de eliminación */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="¿Estás seguro de eliminar este pedido?"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onConfirm={confirmDeleteOrder}
                variant="destructive"
            >
                {orderToDelete && (
                    <div className="space-y-2">
                        <p>
                            Estás a punto de eliminar el pedido de <strong>{orderToDelete.brand?.name || orderToDelete.brandName}</strong>.
                        </p>
                        <p className="text-amber-600 font-medium">
                            Esta acción revertirá cualquier abono asociado a este pedido.
                        </p>
                        <p className="text-red-600 font-bold">
                            Esta acción no se puede deshacer.
                        </p>
                    </div>
                )}
            </ConfirmDialog>

            {/* Modal de Pago */}
            <PaymentModal
                open={paymentModalOpen}
                onOpenChange={setPaymentModalOpen}
                onSubmit={handlePaymentSubmit}
                paymentContext={{
                    type: "PEDIDO",
                    clientId: formik.values.clientId,
                    clientName: clients.find(c => c.id === formik.values.clientId)?.firstName || "Cliente",
                    referenceNumber: formik.values.receiptNumber,
                    description: "Pago inicial de recibo"
                }}
                expectedAmount={totalRowDeposit > 0 ? totalRowDeposit : totalOrderValue}
                allowMultiplePayments={true}
                initialAmount={totalRowDeposit > 0 ? totalRowDeposit : 0}
                orderItems={formik.values.brandItems.map((item, idx) => ({
                    id: item.tempId || `item-${idx}`,
                    brandName: item.brandName,
                    total: Number(item.total),
                    currentDeposit: Number(item.deposit || 0)
                }))}
                lockAmount={formik.values.brandItems.length > 1 && totalRowDeposit > 0}
                forceExactAmount={totalRowDeposit > 0}
            />

            {/* Modal de edición de pedido individual */}
            {editModalOpen && orderToEdit && (
                <OrderEditModal
                    order={orderToEdit}
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    onSuccess={(updatedOrder) => {
                        setEditModalOpen(false)
                        setOrderToEdit(null)
                        if (updatedOrder && editRowIndex !== null && editRowIndex >= 0) {
                            const items = [...formik.values.brandItems]
                            const original = items[editRowIndex]
                            items[editRowIndex] = {
                                ...original,
                                total: Number(updatedOrder.total) || original.total,
                                deposit: Number((updatedOrder as any).deposit ?? original.deposit) || original.deposit,
                                possibleDeliveryDate: updatedOrder.possibleDeliveryDate
                                    ? new Date(updatedOrder.possibleDeliveryDate).toISOString().split('T')[0]
                                    : original.possibleDeliveryDate,
                                orderNumber: updatedOrder.orderNumber || original.orderNumber,
                                status: updatedOrder.status || original.status,
                                payments: updatedOrder.payments || original.payments,
                                paymentMethod: updatedOrder.paymentMethod || original.paymentMethod,
                                bankAccountId: updatedOrder.bankAccountId || original.bankAccountId
                            }
                            formik.setFieldValue('brandItems', items)
                        }
                    }}
                    lastClosureDate={lastClosureDate}
                    bankAccounts={bankAccounts}
                />
            )}

            {/* PDF Preview Modal */}
            {pdfPreview.pdfDocument && (
                <PDFPreviewModal
                    open={pdfPreview.isOpen}
                    onOpenChange={(open) => {
                        pdfPreview.closePreview()
                        // Cuando se cierra el modal después de crear un pedido, navegar a la lista
                        if (!open && !isEditing) {
                            navigate('/orders')
                        }
                    }}
                    title={pdfTitle}
                    pdfDocument={pdfPreview.pdfDocument}
                    fileName={pdfFileName}
                    onDownload={pdfPreview.downloadPDF}
                    onPrint={pdfPreview.printPDF}
                />
            )}

            {/* Blocked Client Modal */}
            <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
                <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-red-50 p-6 flex items-center gap-4 border-b border-red-100">
                        <div className="bg-red-100 p-3 rounded-xl">
                            <Lock className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-red-900">Empresaria Bloqueada</DialogTitle>
                        </div>
                    </div>
                    <div className="p-6 space-y-4 text-center">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-700">
                            La empresaria <span className="text-red-600 font-black">{blockedClientInfo?.name}</span> se encuentra bloqueada en el sistema.
                        </p>
                        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Motivo del bloqueo:</p>
                            <p className="text-xs font-medium text-slate-600 italic">
                                "{blockedClientInfo?.reason}"
                            </p>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                            Por favor regularice su situación antes de continuar con la toma de pedidos.
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <Button 
                            className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg text-xs"
                            onClick={() => setBlockModalOpen(false)}
                        >
                            Entendido
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Componente Modal de Edición Individual
interface OrderEditModalProps {
    order: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (updatedOrder: any) => void
    lastClosureDate: Date | null
    bankAccounts: any[]
}

function OrderEditModal({ order, open, onOpenChange, onSuccess, lastClosureDate, bankAccounts }: OrderEditModalProps) {
    const { notifySuccess, notifyError } = useNotifications()
    const updateOrder = useUpdateOrder()
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        total: Number(order.total) || 0,
        deposit: getPaidAmount(order) || 0,
        possibleDeliveryDate: order.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toISOString().split('T')[0] : '',
        orderNumber: order.orderNumber || '',
        paymentMethod: order.paymentMethod || 'EFECTIVO',
        bankAccountId: order.bankAccountId || ''
    })

    const { data: walletData } = useClientCredits(order.clientId || '')
    const walletBalance = walletData?.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0) || 0

    const filteredBankAccounts = useMemo(() => {
        if (formData.paymentMethod === 'EFECTIVO') {
            return bankAccounts.filter(acc => acc.type === 'CASH')
        }
        return []
    }, [bankAccounts, formData.paymentMethod])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 1. Verificar cierre de caja antes de enviar
        if (lastClosureDate && order.transactionDate) {
            const transactionDate = new Date(order.transactionDate)
            if (transactionDate <= lastClosureDate) {
                notifyError(null, 'No se puede guardar: El periodo de caja para esta fecha ya está cerrado.')
                return
            }
        }
        
        // 2. Verificar estado del pedido y movimientos
        if (order.status !== 'POR_RECIBIR' || (order.payments && order.payments.length > 1)) {
            let reason = 'No se puede editar: El pedido ya tiene movimientos procesados.';
            if (order.status === 'RECIBIDO_EN_BODEGA') reason = 'No se puede editar: El pedido ya ha sido receptado en bodega.';
            if (order.status === 'ENTREGADO') reason = 'No se puede editar: El pedido ya ha sido entregado.';
            if (order.payments && order.payments.length > 1) reason = 'No se puede editar: El pedido ya tiene abonos adicionales vinculados.';
            
            notifyError(null, reason);
            return;
        }

        try {
            const quantity = order.items?.[0]?.quantity || 1
            const unitPrice = quantity > 0 ? formData.total / quantity : 0

            const payload = {
                total: formData.total,
                possibleDeliveryDate: formData.possibleDeliveryDate,
                orderNumber: formData.orderNumber,
                items: [{
                    id: order.items?.[0]?.id || crypto.randomUUID(),
                    productName: order.brand?.name || order.brandName,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    brandId: order.brandId,
                    brandName: order.brand?.name || order.brandName
                }],
                deposit: formData.deposit,
                paymentMethod: formData.paymentMethod,
                bankAccountId: formData.bankAccountId
            }

            console.log('[OrderEditModal] Updating order:', order.id, 'with payload:', payload)
            
            await updateOrder.mutateAsync({ id: order.id, data: payload })
            
            console.log('[OrderEditModal] Update successful')
            
            // Invalidar la query específica del recibo para refrescar caches
            queryClient.invalidateQueries({ queryKey: ['orders', 'receipt', order.receiptNumber] })
            
            notifySuccess('Pedido actualizado correctamente.')
            onSuccess({
                ...order,
                ...payload,
                total: payload.total,
                possibleDeliveryDate: payload.possibleDeliveryDate,
                orderNumber: payload.orderNumber,
                payments: order.payments, // se mantienen igual a nivel de frontend
            })
        } catch (error: any) {
            console.error('Error updating order:', error)
            notifyError(error, 'Error al actualizar el pedido.')
        }
    }

    const saldo = formData.total - formData.deposit

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-slate-800">Editar Pedido</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead className="bg-slate-100 text-slate-600 border-b uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-3 py-2 border-r text-left">Catálogo</th>
                                    <th className="px-3 py-2 border-r text-left">N° Pedido</th>
                                    <th className="px-3 py-2 border-r text-right">Valor Pedido</th>
                                    <th className="px-3 py-2 border-r text-right">Abono</th>
                                    <th className="px-3 py-2 border-r text-right">Saldo</th>
                                    <th className="px-3 py-2 text-left">Posible Entrega</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="hover:bg-indigo-50/20 transition-colors">
                                    <td className="px-3 py-2 border-r">
                                        <Input
                                            value={order.brand?.name || order.brandName}
                                            disabled
                                            className="h-8 text-xs bg-slate-50 border-none"
                                        />
                                    </td>
                                    <td className="px-3 py-2 border-r">
                                        <Input
                                            value={formData.orderNumber}
                                            onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                                            placeholder="Ej: 12345"
                                            className="h-8 text-xs font-mono"
                                        />
                                    </td>
                                    <td className="px-3 py-2 border-r text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <span className="text-slate-400 text-xs">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="h-7 w-20 text-right font-bold border-none focus:ring-0 outline-none text-xs bg-transparent hide-spinner"
                                                value={formData.total}
                                                onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 border-r text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <span className="text-green-600 text-xs">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="h-7 w-20 text-right text-green-600 font-bold rounded border-green-100 focus:ring-1 focus:ring-green-500 outline-none text-xs bg-green-50/30 hide-spinner"
                                                value={formData.deposit}
                                                onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 border-r text-right">
                                        <span className={`font-bold text-xs ${saldo > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                            ${saldo.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="date"
                                            value={formData.possibleDeliveryDate}
                                            onChange={(e) => setFormData({ ...formData, possibleDeliveryDate: e.target.value })}
                                            required
                                            className="h-8 text-xs pr-8"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-600">
                                Método de Pago:
                                {formData.paymentMethod === 'BILLETERA_VIRTUAL' && (
                                    <span className="ml-2 text-emerald-600 font-medium"> (Saldo: ${walletBalance.toFixed(2)})</span>
                                )}
                            </Label>
                            <select
                                className="w-full h-9 rounded-md border border-slate-200 text-xs px-3 focus:ring-1 focus:ring-monchito-purple outline-none"
                                value={formData.paymentMethod}
                                onChange={(e) => {
                                    const method = e.target.value
                                    setFormData({ 
                                        ...formData, 
                                        paymentMethod: method,
                                        bankAccountId: method === 'EFECTIVO' 
                                            ? (bankAccounts.find((a: any) => a.type === 'CASH')?.id || '') 
                                            : ''
                                    })
                                }}
                            >
                                <option value="EFECTIVO">EFECTIVO</option>
                                <option value="BILLETERA_VIRTUAL">BILLETERA VIRTUAL</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-600">Cuenta Bancaria:</Label>
                            <select
                                className="w-full h-9 rounded-md border border-slate-200 text-xs px-3 focus:ring-1 focus:ring-monchito-purple outline-none"
                                value={formData.bankAccountId}
                                onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                                disabled={formData.paymentMethod === 'BILLETERA_VIRTUAL'}
                            >
                                <option value="">{formData.paymentMethod === 'BILLETERA_VIRTUAL' ? 'No se requiere (Se usa Saldo a Favor)' : 'Seleccione una cuenta...'}</option>
                                {filteredBankAccounts.map((acc: any) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.bankName || (acc.type === 'CASH' ? 'Efectivo' : 'Banco')})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateOrder.isPending}
                            className="h-8 text-xs"
                        >
                            Cancelar
                        </Button>
                        <AsyncButton
                            type="submit"
                            isLoading={updateOrder.isPending}
                            className="bg-slate-800 h-8 text-xs"
                        >
                            Guardar Cambios
                        </AsyncButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
