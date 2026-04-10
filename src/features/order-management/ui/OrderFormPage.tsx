import { useState, useEffect } from "react"
import { useFormik } from "formik"
import { useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import * as Yup from "yup"
import { 
    ArrowLeft, Plus, X, RotateCw, RefreshCw, 
    Edit2, Trash2, Printer, FileText, 
    AlertTriangle, Lock, Save 
} from "lucide-react"

import { incrementOrderNumber } from "@/shared/lib/utils"
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
import { useClientCredits } from "@/features/transactions/model/hooks"
import { useAuth } from "@/shared/auth"
import { useCashClosurePreview } from "@/features/cash-closure/api/hooks"
import { PaymentModal, type PaymentModalData } from "@/shared/ui/PaymentModal"
import { usePDFPreview } from "@/shared/hooks/usePDFPreview"
import { PDFPreviewModal } from "@/shared/ui/PDFPreviewModal"
import { SearchableSelect } from "@/shared/ui/SearchableSelect"
import { OrderEditModal } from "./OrderEditModal"
import { systemSettingsApi } from "@/features/system-settings/api/systemSettingsApi"

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
    isBlocked: Yup.boolean(),
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


export function OrderFormPage() {
    const formatDateSafe = (date: any) => {
        if (!date) return '';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    };

    const { id, receiptNumber } = useParams()
    const navigate = useNavigate()
    const isEditing = !!(id || receiptNumber)
    const queryClient = useQueryClient()



    // Caso 1: Edición por receiptNumber (carga múltiples pedidos)
    const { data: receiptOrders, isLoading: isLoadingReceiptOrders } = useReceiptOrders(receiptNumber || "")
    
    // Caso 2: Edición por ID individual (carga un solo pedido)
    const { data: order, isLoading: isLoadingOrder } = useOrder(id || "")
    
    const { data: clientsResponse } = useClientList({ limit: 1000 })
    const { data: brandsResponse } = useBrandList({ limit: 1000 })

    const clients = clientsResponse?.data || []
    const brands = brandsResponse?.data || []
    
    const { data: bankAccountsResponse } = useBankAccountList()
    const bankAccounts = bankAccountsResponse?.data || []
    
    const createOrder = useCreateOrder()
    const { notifySuccess, notifyError, notifyLoading, dismiss } = useNotifications()
    const { user, hasPermission } = useAuth()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingReceiptNumber, setIsLoadingReceiptNumber] = useState(false)
    const [isLoadingOrderNumber, setIsLoadingOrderNumber] = useState(false)
    const [isLoadingRelated, setIsLoadingRelated] = useState(false)
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
    const [justUpdated, setJustUpdated] = useState(false)
    const [globalNextOrderNumber, setGlobalNextOrderNumber] = useState<string>("")
    const [lastAutoGeneratedReceiptNumber, setLastAutoGeneratedReceiptNumber] = useState<string>("")
    const [lastAutoGeneratedOrderNumber, setLastAutoGeneratedOrderNumber] = useState<string>("")
    
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
    const [permissionModalOpen, setPermissionModalOpen] = useState(false)

    // PDF Preview state
    const [pdfTitle, setPdfTitle] = useState('')
    const [pdfFileName, setPdfFileName] = useState('')

    // Dynamic configuration states
    const [dynamicOrderTypes, setDynamicOrderTypes] = useState<any[]>([])
    const [dynamicSalesChannels, setDynamicSalesChannels] = useState<any[]>([])

    useEffect(() => {
        const fetchSystemConfig = async () => {
            try {
                const [types, channels] = await Promise.all([
                    systemSettingsApi.getOrderTypes(),
                    systemSettingsApi.getSalesChannels()
                ])
                setDynamicOrderTypes(types.filter((t: any) => t.isActive && t.name !== 'CAMBIO' && t.name !== 'CATALOGO'))
                setDynamicSalesChannels(channels.filter((c: any) => c.isActive))
            } catch (error) {
                console.error("Error fetching system config", error)
                // Fallback to defaults to prevent breakage
                setDynamicOrderTypes([
                    { name: 'NORMAL' }, { name: 'PREVENTA' }, { name: 'REPROGRAMACION' }
                ])
                setDynamicSalesChannels([
                    { name: 'OFICINA' }, { name: 'WHATSAPP' }, { name: 'DOMICILIO' }
                ])
            }
        }
        fetchSystemConfig()
    }, [])

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
        
        // Mantener rastro de los valores actuales para permitir reintentos
        let currentReceiptNumber = formik.values.receiptNumber;
        let currentBrandItems = [...formik.values.brandItems];
        
        try {
            const totalAmount = paymentData.payments.reduce((sum, p) => sum + p.amount, 0);
            const walletCreditUsed = paymentData.payments
                .filter(p => p.method === 'BILLETERA_VIRTUAL')
                .reduce((sum, p) => sum + p.amount, 0);

            const activePayments = paymentData.payments.filter(p => p.amount > 0);

            let createdOrders: any = null;
            let success = false;
            let attempts = 0;
            const MAX_ATTEMPTS = 2;

            while (!success && attempts < MAX_ATTEMPTS) {
                attempts++;
                
                // Construir el batchPayload
                const batchPayload = {
                    receipt_number: currentReceiptNumber,
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
                    },
                    orders: currentBrandItems.map((item: BrandItem) => {
                        const unitPrice = item.quantity > 0 ? item.total / item.quantity : 0;
                        return {
                            brand_id: item.brandId,
                            brand_name: item.brandName,
                            total: item.total,
                            deposit: Number(item.deposit) || 0,
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

                try {
                    if (isEditing && formik.values.receiptNumber) {
                        createdOrders = await orderApi.batchUpdate(formik.values.receiptNumber, batchPayload);
                    } else {
                        createdOrders = await orderApi.batchCreate(batchPayload);
                    }
                    success = true;
                    if (attempts > 1) dismiss(); // Limpiar toast de reintento si existe
                } catch (error: any) {
                    const errorMsg = error?.message?.toLowerCase() || "";
                    const isConflict = error?.status === 409 || 
                                     errorMsg.includes('existe') || 
                                     errorMsg.includes('duplicado') || 
                                     errorMsg.includes('duplicate');

                    // Si es conflicto y nos quedan intentos, sincronizamos y reintentamos
                    if (isConflict && attempts < MAX_ATTEMPTS) {
                        notifyLoading("Conflicto de N° de pedido/recibo detectado. Sincronizando nuevos números y reintentando envío...");
                        
                        // 1. Obtener nuevos números reales del server
                        const [newReceiptRes, newOrderRes] = await Promise.all([
                            orderApi.generateReceiptNumber(),
                            orderApi.generateOrderNumber()
                        ]);
                        
                        const newReceipt = newReceiptRes.receiptNumber;
                        const newGlobalOrder = newOrderRes.orderNumber;

                        // 2. Actualizar el estado para el UI
                        formik.setFieldValue('receiptNumber', newReceipt);
                        setLastAutoGeneratedReceiptNumber(newReceipt);
                        setLastSyncTime(new Date());

                        // 3. Actualizar ítems de la tabla para el siguiente intento
                        currentReceiptNumber = newReceipt;
                        let nextNum = newGlobalOrder;
                        currentBrandItems = currentBrandItems.map(item => {
                            const updated = { ...item, orderNumber: nextNum };
                            nextNum = incrementOrderNumber(nextNum);
                            return updated;
                        });
                        
                        // Sincronizar formik para que la tabla muestre los números reales con los que se reintenta
                        formik.setFieldValue("brandItems", currentBrandItems);
                        
                        // Actualizar también el currentItem del POST (donde se agregan nuevos)
                        setCurrentItem((prev: BrandItem) => ({ ...prev, orderNumber: nextNum }));
                        setLastAutoGeneratedOrderNumber(nextNum);

                        await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa breve para que el usuario vea el toast
                        continue;
                    }
                    // Si no es un conflicto o falló el reintento, lanzamos el error
                    throw error;
                }
            }

            // Invalidar queries en paralelo para evitar cascadas
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['orders'] }),
                queryClient.invalidateQueries({ queryKey: ['financial-records'] }),
                queryClient.invalidateQueries({ queryKey: ['transactions'] }),
                queryClient.invalidateQueries({ queryKey: ['client-credit', formik.values.clientId] }),
                queryClient.invalidateQueries({ queryKey: ['client-credits', formik.values.clientId] }),
                queryClient.invalidateQueries({ queryKey: ['client-credits-summary'] }),
                queryClient.invalidateQueries({ queryKey: ['clients'] })
            ]);

            // Map orderNumbers from final created items back (using the ones from currentBrandItems)
            const ordersWithNumbers = createdOrders.map((createdOrder: any, index: number) => {
                const originalItem = currentBrandItems[index];
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
            } catch (pdfError) {
                console.error("Error preparing PDF", pdfError)
                notifyError(pdfError, "Error al preparar el recibo PDF.")
                notifySuccess(`Se han creado ${createdOrders.length} pedidos exitosamente.`);
                if (!isEditing) {
                    localStorage.removeItem(DRAFT_KEY);
                    localStorage.removeItem(ITEM_DRAFT_KEY);
                }
                navigate('/orders');
            }
        } catch (error: any) {
            console.error("Error saving order", error)
            dismiss(); // Limpiar posibles toasts de carga
            notifyError(error, "Error al guardar el pedido.");
            // Actualizar índices por si acaso para la próxima vez que el usuario intente manualmente
            generateNextReceiptNumber(false, true);
            generateNextOrderNumber(false, true);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Función para guardar solo las notas del recibo
    const handleSaveNotes = async () => {
        if (!receiptNumber) return;
        
        setIsSubmitting(true);
        try {
            notifyLoading("Actualizando observaciones del recibo...");
            await orderApi.updateReceiptHeader(receiptNumber, { 
                notes: formik.values.notes 
            });
            
            // Invalidar las queries para reflejar el cambio en todos lados
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['receiptOrders', receiptNumber] });
            
            dismiss();
            notifySuccess("Observaciones actualizadas correctamente.");
        } catch (error: any) {
            dismiss();
            console.error("Error updating receipt notes", error);
            notifyError(error, "Error al actualizar las observaciones.");
        } finally {
            setIsSubmitting(false);
        }
    };

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

    const generateNextReceiptNumber = async (isPeriodic = false, force = false) => {
        try {
            if (!isPeriodic) setIsLoadingReceiptNumber(true);
            const { receiptNumber } = await orderApi.generateReceiptNumber();
            
            // Si el valor actual es igual al último que auto-generamos, o si está vacío, lo actualizamos.
            // Esto evita sobreescribir si el usuario escribió algo manualmente, a menos que se force.
            if (force || !formik.values.receiptNumber || formik.values.receiptNumber === lastAutoGeneratedReceiptNumber) {
                if (isPeriodic && formik.values.receiptNumber && formik.values.receiptNumber !== receiptNumber) {
                    setJustUpdated(true);
                    setTimeout(() => setJustUpdated(false), 2000);
                }
                formik.setFieldValue('receiptNumber', receiptNumber);
                setLastAutoGeneratedReceiptNumber(receiptNumber);
                setLastSyncTime(new Date());
            }
        } catch (error) {
            console.error('Error generating receipt number:', error);
            if (!isPeriodic) {
                const year = new Date().getFullYear();
                formik.setFieldValue('receiptNumber', `OR-${year}-001`);
            }
        } finally {
            if (!isPeriodic) setIsLoadingReceiptNumber(false);
        }
    };

    const generateNextOrderNumber = async (isPeriodic = false, force = false) => {
        try {
            if (!isPeriodic) setIsLoadingOrderNumber(true);
            const { orderNumber } = await orderApi.generateOrderNumber();
            setGlobalNextOrderNumber(orderNumber);
            
            // Si el currentItem no tiene número o tiene el valor que auto-generamos antes, actualizarlo
            const isCurrentMatchLast = currentItem.orderNumber === lastAutoGeneratedOrderNumber;
            const isCurrentEmpty = !currentItem.orderNumber;
            const isDefaultPattern = currentItem.orderNumber && currentItem.orderNumber.startsWith(`PD-${new Date().getFullYear()}`);

            if (force || isCurrentEmpty || isCurrentMatchLast || (isPeriodic && isDefaultPattern)) {
                setCurrentItem((prev: BrandItem) => ({ ...prev, orderNumber: orderNumber }));
                setLastAutoGeneratedOrderNumber(orderNumber);
            }
        } catch (error) {
            console.error('Error generating order number:', error);
            const year = new Date().getFullYear();
            setGlobalNextOrderNumber(`PD-${year}-001`);
        } finally {
            if (!isPeriodic) setIsLoadingOrderNumber(false);
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

        // 2. Verificar estado del pedido (No editable si ya fue receptado o entregado)
        const BLOCKED_STATUSES = ['RECIBIDO_EN_BODEGA', 'ENTREGADO', 'CAMBIADO'];
        if (BLOCKED_STATUSES.includes(order.status)) {
            return {
                canEdit: false,
                reason: `No se puede editar: El pedido ya está en estado ${order.status}.`
            }
        }

        // 3. Verificar abonos adicionales
        // Se permiten hasta 2 abonos si uno de ellos es 'CREDITO_CLIENTE' (abono inicial combinado)
        const payments = order.payments || [];
        const hasExtraPayments = payments.length > 2 || (payments.length > 1 && !payments.some((p: any) => p.method === 'CREDITO_CLIENTE'));
        
        if (hasExtraPayments) {
            return {
                canEdit: false,
                reason: 'No se puede editar: El pedido ya tiene abonos adicionales registrados desde el módulo de abonos.'
            }
        }

        return { canEdit: true }
    }

    // Función para validar si un pedido puede ser eliminado
    const canDeleteOrder = (order: any): { canDelete: boolean; reason?: string } => {
        // Validar permiso
        if (!hasPermission('orders.delete')) {
            return {
                canDelete: false,
                reason: 'No tienes permisos para eliminar pedidos (orders.delete).'
            }
        }

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
            notifyLoading(`Eliminando pedido ${orderToDelete.orderNumber || ''}...`)
            await orderApi.delete(orderToDelete.id)
            
            dismiss()
            // Invalidar las queries relacionadas en lugar de recargar la página
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            queryClient.invalidateQueries({ queryKey: ['order', orderToDelete.id] })
            queryClient.invalidateQueries({ queryKey: ['receiptOrders', orderToDelete.receiptNumber] })
            
            notifySuccess('Pedido eliminado correctamente.')
        } catch (error: any) {
            dismiss()
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
                    setCurrentItem((prev: BrandItem) => ({ 
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
            .map((item: BrandItem) => item.orderNumber)
            .filter((num: string | undefined) => num && num.startsWith(userPrefix));
        
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
            setCurrentItem((prev: BrandItem) => ({ ...prev, orderNumber: nextNum }));
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
                        const allItems = Array.isArray(receiptOrders) ? receiptOrders : [];
                        const firstOrder = allItems.length > 0 ? allItems[0] : null;
                        
                        if (!firstOrder) {
                            setIsLoadingRelated(false);
                            return;
                        }

                        const parentOrderNumber = allItems.find(item => 
                            item && (item.type === 'NORMAL' || item.type === 'PREVENTA')
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
                                possibleDeliveryDate: formatDateSafe(o.possibleDeliveryDate),
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
                            createdAt: formatDateSafe(firstOrder.createdAt) || formatDateSafe(new Date()),
                            transactionDate: formatDateSafe(firstOrder.transactionDate) || formatDateSafe(new Date()),
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
                    const responseData = (response as any)?.data;
                    const allItems = Array.isArray(responseData) 
                        ? responseData 
                        : (Array.isArray(response) ? response : [order]);

                    // Encontrar el orderNumber de un pedido NORMAL o PREVENTA para las reprogramaciones
                    const parentOrderNumber = allItems.find((item: any) => 
                        item && (item.type === 'NORMAL' || item.type === 'PREVENTA')
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
                            possibleDeliveryDate: formatDateSafe(o.possibleDeliveryDate),
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
                        createdAt: formatDateSafe(order.createdAt) || formatDateSafe(new Date()),
                        transactionDate: formatDateSafe(order.transactionDate) || formatDateSafe(new Date()),
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
            // Caso 3: Modo creación - Forzar sincronización inicial para evitar números obsoletos del draft
            else if (!isEditing) {
                generateNextReceiptNumber(false, true);
                generateNextOrderNumber(false, true);
            }
        };

        loadAllItems();
    }, [order, receiptOrders, isEditing, id, receiptNumber, isLoadingReceiptOrders, isLoadingOrder]);

    // Polling en tiempo real para el correlativo (cada 6 segundos)
    useEffect(() => {
        if (isEditing) return;

        const interval = setInterval(() => {
            generateNextReceiptNumber(true);
            generateNextOrderNumber(true);
        }, 6000);

        return () => clearInterval(interval);
    }, [isEditing, lastAutoGeneratedReceiptNumber, lastAutoGeneratedOrderNumber, formik.values.receiptNumber]);

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
    const totalOrderValue = formik.values.brandItems.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);

    // Total deposit is now the sum of manual row deposits
    const totalRowDeposit = formik.values.brandItems.reduce((sum: number, item: any) => sum + (Number(item.deposit) || 0), 0);

    const handleHeaderKeyDown = (e: React.KeyboardEvent, fieldName: string) => {
        const fields = [
            'receiptNumber', 'clientId',
            'salesChannel', 'type', 'orderNumber', 'quantity', 
            'brandId', 'total', 'possibleDeliveryDate', 'addButton',
            'notes', 'saveButton', 'printButton'
        ];
        const currentIndex = fields.indexOf(fieldName);

        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const tagName = e.currentTarget.tagName;
            const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA';
            const isSelect = tagName === 'SELECT' || tagName === 'DIV'; // DIV para SearchableSelect
            
            let selectionAtBoundary = false;
            if (isInput) {
                const input = e.currentTarget as HTMLInputElement;
                try {
                    if (input.selectionStart !== null) {
                        if (e.key === 'ArrowRight') {
                            selectionAtBoundary = input.selectionStart === input.value.length;
                        } else {
                            selectionAtBoundary = input.selectionStart === 0;
                        }
                    } else {
                        // Para tipos sin selección (date), permitimos salto directo si no es texto
                        selectionAtBoundary = true;
                    }
                } catch(err) {
                    selectionAtBoundary = true;
                }
            } else if (isSelect) {
                selectionAtBoundary = true;
            }

            if (selectionAtBoundary) {
                const direction = e.key === 'ArrowRight' ? 1 : -1;
                const nextIndex = currentIndex + direction;
                
                if (nextIndex >= 0 && nextIndex < fields.length) {
                    if (fieldName === 'addButton' && direction === 1) {
                        const firstTableInput = document.querySelector(`[data-row-index="0"][data-field-name="total"]`) as HTMLElement;
                        if (firstTableInput) {
                            e.preventDefault();
                            firstTableInput.focus();
                            return;
                        }
                    }

                    e.preventDefault();
                    const target = document.querySelector(`[data-nav="${fields[nextIndex]}"]`) as HTMLElement;
                    if (target) {
                        target.focus();
                        if (target instanceof HTMLInputElement && target.type !== 'date') {
                            try { target.select(); } catch(e) {}
                        }
                    }
                }
            }
        }

        if (e.key === 'ArrowDown') {
            const jumps: Record<string, string> = {
                'receiptNumber': 'salesChannel',
                'clientId': 'brandId',
                'orderNumber': 'total',
            };
            
            const targetName = jumps[fieldName];
            if (targetName) {
                e.preventDefault();
                const target = document.querySelector(`[data-nav="${targetName}"]`) as HTMLElement;
                if (target) target.focus();
            } else {
                // Try jump to table
                const firstTableInput = document.querySelector(`[data-row-index="0"][data-field-name="total"]`) as HTMLElement;
                if (firstTableInput) {
                    e.preventDefault();
                    firstTableInput.focus();
                }
            }
        }

        if (e.key === 'ArrowUp') {
            const jumps: Record<string, string> = {
                'salesChannel': 'receiptNumber',
                'brandId': 'clientId',
                'total': 'orderNumber',
            };
            
            const targetName = jumps[fieldName];
            if (targetName) {
                e.preventDefault();
                const target = document.querySelector(`[data-nav="${targetName}"]`) as HTMLElement;
                if (target) target.focus();
            }
        }
    };

    const handleTableKeyDown = (e: React.KeyboardEvent, rowIndex: number, fieldName: string) => {
        const input = e.currentTarget as HTMLInputElement;
        const fields = ['total', 'deposit', 'possibleDeliveryDate'];
        let selectionAtBoundary = false;
        
        try {
            if (input.selectionStart !== null) {
                if (e.key === 'ArrowRight') selectionAtBoundary = input.selectionStart === input.value.length;
                else if (e.key === 'ArrowLeft') selectionAtBoundary = input.selectionStart === 0;
            } else {
                // Para tipos que no soportan selección (date), saltar siempre
                selectionAtBoundary = true;
            }
        } catch(e) {
            selectionAtBoundary = true;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const direction = 1;
            const targetRowIndex = rowIndex + direction;
            if (targetRowIndex < formik.values.brandItems.length) {
                const targetInput = document.querySelector(`[data-row-index="${targetRowIndex}"][data-field-name="${fieldName}"]`) as HTMLInputElement;
                if (targetInput) {
                    targetInput.focus();
                    if (targetInput.type !== 'number' && targetInput.type !== 'date') targetInput.select();
                }
            } else {
                // Saltar a las notas
                const notes = document.querySelector(`[data-nav="notes"]`) as HTMLElement;
                if (notes) notes.focus();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const direction = -1;
            const targetRowIndex = rowIndex + direction;
            if (targetRowIndex >= 0) {
                const targetInput = document.querySelector(`[data-row-index="${targetRowIndex}"][data-field-name="${fieldName}"]`) as HTMLInputElement;
                if (targetInput) {
                    targetInput.focus();
                    if (targetInput.type !== 'number' && targetInput.type !== 'date') targetInput.select();
                }
            } else {
                // Saltar de vuelta a la barra de entrada
                const barTarget = document.querySelector(`[data-nav="${fieldName === 'possibleDeliveryDate' ? 'possibleDeliveryDate' : (fieldName === 'total' ? 'total' : 'brandId')}"]`) as HTMLElement;
                if (barTarget) barTarget.focus();
            }
        } else if (e.key === 'ArrowLeft' && selectionAtBoundary) {
            const currentIndex = fields.indexOf(fieldName);
            if (currentIndex > 0) {
                const targetInput = document.querySelector(`[data-row-index="${rowIndex}"][data-field-name="${fields[currentIndex - 1]}"]`) as HTMLInputElement;
                if (targetInput) {
                    e.preventDefault();
                    targetInput.focus();
                    if (targetInput.type !== 'number' && targetInput.type !== 'date') targetInput.select();
                }
            } else if (rowIndex > 0) {
                // Saltar al final de la fila anterior
                const prevRowLastInput = document.querySelector(`[data-row-index="${rowIndex - 1}"][data-field-name="${fields[fields.length - 1]}"]`) as HTMLInputElement;
                if (prevRowLastInput) {
                    e.preventDefault();
                    prevRowLastInput.focus();
                }
            } else {
                // Saltar de vuelta al addButton del header
                const addButton = document.querySelector(`[data-nav="addButton"]`) as HTMLElement;
                if (addButton) {
                    e.preventDefault();
                    addButton.focus();
                }
            }
        } else if (e.key === 'ArrowRight' && selectionAtBoundary) {
            const currentIndex = fields.indexOf(fieldName);
            if (currentIndex < fields.length - 1) {
                const targetInput = document.querySelector(`[data-row-index="${rowIndex}"][data-field-name="${fields[currentIndex + 1]}"]`) as HTMLInputElement;
                if (targetInput) {
                    e.preventDefault();
                    targetInput.focus();
                    if (targetInput.type !== 'number' && targetInput.type !== 'date') targetInput.select();
                }
            } else if (rowIndex < formik.values.brandItems.length - 1) {
                // Saltar al inicio de la siguiente fila
                const nextRowFirstInput = document.querySelector(`[data-row-index="${rowIndex + 1}"][data-field-name="${fields[0]}"]`) as HTMLInputElement;
                if (nextRowFirstInput) {
                    e.preventDefault();
                    nextRowFirstInput.focus();
                }
            } else {
                // Saltar a las notas
                const notes = document.querySelector(`[data-nav="notes"]`) as HTMLElement;
                if (notes) {
                    e.preventDefault();
                    notes.focus();
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

                // Crear cada nuevo pedido con números incrementales
                let nextNum = currentItem.orderNumber;
                for (const itemToCreate of itemsToCreate) {
                    // Si es reprogramación y ya avanzamos del primero, incrementar número
                    if (itemToCreate.type === 'REPROGRAMACION' && itemsToCreate.indexOf(itemToCreate) > 0) {
                        nextNum = incrementOrderNumber(nextNum);
                    }

                    // Garantizar que brandName esté presente buscando en la lista local si falta
                    let finalBrandName = itemToCreate.brandName
                    if (!finalBrandName && itemToCreate.brandId) {
                        const b = brands.find(x => x.id === itemToCreate.brandId)
                        finalBrandName = b ? b.name : "Marca"
                    }

                    const qty = Number(itemToCreate.quantity || 1)
                    const totalVal = Number(itemToCreate.total || 0)
                    const unitPrice = qty > 0 ? totalVal / qty : 0

                    if (!finalBrandName) {
                        notifyError(null, "No se pudo determinar el nombre del catálogo.")
                        continue
                    }

                    const payload = {
                        clientId: formik.values.clientId,
                        clientName,
                        receiptNumber: formik.values.receiptNumber,
                        salesChannel: itemToCreate.salesChannel || formik.values.salesChannel,
                        type: itemToCreate.type,
                        brandId: itemToCreate.brandId,
                        brandName: finalBrandName,
                        total: totalVal, 
                        possibleDeliveryDate: itemToCreate.possibleDeliveryDate,
                        notes: formik.values.notes,
                        createdAt: formik.values.createdAt,
                        transaction_date: formik.values.transactionDate,
                        paymentMethod: formik.values.paymentMethod,
                        items: [{
                            productName: finalBrandName, // Usamos brandName como nombre del producto principal
                            quantity: qty,
                            unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                            brandId: itemToCreate.brandId,
                            brandName: finalBrandName
                        }],
                        deposit: 0, // Nuevo pedido sin abono inicial
                        creditToUse: 0,
                        parentOrderId: parentOrderId || undefined,
                        orderNumber: nextNum || undefined
                    }

                    await createOrder.mutateAsync(payload as any)
                }

                // Invalidar queries para recargar los datos
                queryClient.invalidateQueries({ queryKey: ['orders'] })
                queryClient.invalidateQueries({ queryKey: ['receiptOrders', formik.values.receiptNumber] })

                notifySuccess(`${itemsToCreate.length} pedido(s) agregado(s) correctamente.`)

                // Reset item
                setCurrentItem((prev: BrandItem) => ({
                    ...prev,
                    brandId: "",
                    brandName: "",
                    total: 0,
                    quantity: 1,
                    orderNumber: incrementOrderNumber(prev.orderNumber)
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
                let subNextNum = currentItem.orderNumber;
                const subItems = Array.from({ length: currentItem.quantity }).map((_, i) => {
                    const item = {
                        ...currentItem,
                        id: crypto.randomUUID(),
                        tempId: `temp-${baseId}-${i}`,
                        quantity: 1,
                        total: Number((currentItem.total / currentItem.quantity).toFixed(2)),
                        orderNumber: subNextNum,
                        brandName: currentItem.brandName || brands.find(b => b.id === currentItem.brandId)?.name || 'Sin marca'
                    };
                    subNextNum = incrementOrderNumber(subNextNum);
                    return item;
                });
                formik.setFieldValue("brandItems", [...formik.values.brandItems, ...subItems]);
            } else {
                formik.setFieldValue("brandItems", [...formik.values.brandItems, { 
                    ...currentItem, 
                    tempId: baseId,
                    deposit: 0 
                }]);
            }

            // Reset item except channel and date for speed
            setCurrentItem((prev: BrandItem) => ({
                ...prev,
                brandId: "",
                brandName: "",
                total: 0,
                quantity: 1,
                orderNumber: incrementOrderNumber(prev.orderNumber)
            }));
        }
    }

    const removeItem = (index: number) => {
        const itemToRemove = formik.values.brandItems[index];
        
        // If it's an existing order with ID, we should handle it via handleDeleteOrder
        if (isEditing && itemToRemove.id) {
            handleDeleteOrder(itemToRemove);
            return;
        }

        // Para remover items locales en modo edición o creación, verificar permiso de eliminar item
        if (!hasPermission('orders.delete_item')) {
            notifyError(null, "No tienes permiso para eliminar items individuales de este pedido (orders.delete_item).");
            return;
        }

        const items = formik.values.brandItems.filter((_: BrandItem, i: number) => i !== index);
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

        // Forzar validación de todo el formulario para capturar errores de campos no "tocados"
        const errors = await formik.validateForm();
        if (Object.keys(errors).length > 0) {
            // Mostrar el primer error encontrado
            const firstError = Object.values(errors)[0]
            if (typeof firstError === 'string') {
                notifyError(null, firstError)
            } else if (typeof firstError === 'object') {
                // Manejar errores en arrays de objetos (brandItems)
                const errorMsg = Object.values(firstError as object)[0]
                if (typeof errorMsg === 'string') notifyError(null, errorMsg)
            }
            return
        }

        // Mostrar errores de validación si existen (redundancia por si acaso)
        if (Object.keys(formik.errors).length > 0) {
            const firstError = Object.values(formik.errors)[0]
            if (typeof firstError === 'string') {
                notifyError(null, firstError)
            } else if (Array.isArray(firstError)) {
                // Find first non-undefined error in the brandItems array
                const firstActualItemError = firstError.find((e: any) => e !== undefined)
                if (firstActualItemError && typeof firstActualItemError === 'object') {
                    const firstMsg = Object.values(firstActualItemError)[0]
                    if (typeof firstMsg === 'string') {
                        notifyError(null, `Error en fila: ${firstMsg}`)
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

        // Validar abono $0
        const totalAbono = totalRowDeposit + Number(formik.values.creditToUse);
        const isZeroDeposit = totalAbono <= 0.001; // Usamos un margen pequeño para floats

        if (isZeroDeposit && !hasPermission('orders.save_with_zero_deposit')) {
            setPermissionModalOpen(true);
            return;
        }

        // Abrir modal de pago (sin validación de distribución)
        setPaymentModalOpen(true)
    }

    // Si está cargando el bloqueo, mostramos un overlay para evitar parpadeo o edición antes de tiempo
    // Removed locking loading state check

    return (
        <div className="space-y-6">
            {/* Modal de Permiso Requerido */}
            <Dialog open={permissionModalOpen} onOpenChange={setPermissionModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-600">
                            <Lock className="h-5 w-5" />
                            Permiso Requerido
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
                        <p className="text-sm text-orange-800 leading-relaxed font-bold">
                            Acceso Restringido
                        </p>
                        <p className="text-sm text-orange-800 leading-relaxed">
                            No cuentas con el permiso suficiente para guardar un recibo con **abono de $0.00**. Si crees que esto es un error, contacta al administrador del sistema.
                        </p>
                        <p className="text-[11px] text-orange-700 font-medium">
                            Permiso requerido: <code className="bg-orange-200 px-1 rounded text-orange-900 font-bold">orders.save_with_zero_deposit</code>.
                        </p>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button 
                            variant="default" 
                            className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold"
                            onClick={() => setPermissionModalOpen(false)}
                        >
                            Entendido
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-600">No de recibo:</Label>
                                <div className="flex gap-1">
                                    <div className="relative flex-1">
                                        <Input
                                            {...formik.getFieldProps('receiptNumber')}
                                            disabled={isLoadingReceiptNumber || isEditing}
                                            onKeyDown={e => handleHeaderKeyDown(e, 'receiptNumber')}
                                            data-nav="receiptNumber"
                                            className={`h-9 text-sm font-mono font-bold text-monchito-purple bg-monchito-purple/5 transition-all duration-500 ${justUpdated ? 'ring-2 ring-monchito-purple animate-pulse shadow-[0_0_15px_-3px_rgba(111,63,169,0.3)]' : ''}`}
                                        />
                                        {!isEditing && lastSyncTime && (
                                            <span className="absolute -bottom-3.5 right-0 text-[8px] font-black uppercase tracking-[0.05em] text-monchito-purple/40 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-500">
                                                <RefreshCw className={`h-2 w-2 ${isLoadingReceiptNumber ? 'animate-spin' : ''}`} /> Sincronizado: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    {!isEditing && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                generateNextReceiptNumber(false, true);
                                                generateNextOrderNumber(false, true);
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
                                <Label className="text-xs font-bold text-slate-600">Fecha de Registro:</Label>
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
                    <div className="w-full sm:w-[130px] space-y-1 shrink-0">
                        <Label className="text-xs font-bold uppercase text-slate-500">Pedido por:</Label>
                        <select
                            value={currentItem.salesChannel}
                            onChange={(e) => setCurrentItem({ ...currentItem, salesChannel: e.target.value as SalesChannel })}
                            onKeyDown={e => handleHeaderKeyDown(e, 'salesChannel')}
                            data-nav="salesChannel"
                            className="h-8 w-full rounded-md border border-input text-xs px-2 py-1 focus:ring-1 focus:ring-monchito-purple outline-none"
                        >
                            {dynamicSalesChannels.length > 0 ? (
                                dynamicSalesChannels.map(c => <option key={c.name} value={c.name}>{c.name}</option>)
                            ) : (
                                <>
                                    <option value="OFICINA">OFICINA</option>
                                    <option value="WHATSAPP">WHATSAPP</option>
                                    <option value="DOMICILIO">DOMICILIO</option>
                                </>
                            )}
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
                            {dynamicOrderTypes.length > 0 ? (
                                dynamicOrderTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)
                            ) : (
                                <>
                                    <option value="NORMAL">NORMAL</option>
                                    <option value="PREVENTA">PREVENTA</option>
                                    <option value="REPROGRAMACION">REPROGRAMACION</option>
                                </>
                            )}
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
                            type="text"
                            inputMode="numeric"
                            className="h-8 w-full text-xs px-2 hide-spinner"
                            value={currentItem.quantity === 0 ? '' : currentItem.quantity}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setCurrentItem({ ...currentItem, quantity: val === '' ? 0 : Number(val) });
                            }}
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
                            type="text"
                            inputMode="decimal"
                            className="h-8 w-full font-bold text-xs px-2 hide-spinner"
                            value={currentItem.total === 0 ? '' : currentItem.total}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setCurrentItem({ ...currentItem, total: val === '' ? 0 : Number(val) });
                            }}
                            onKeyDown={e => handleHeaderKeyDown(e, 'total')}
                            data-nav="total"
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
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Tipo</th>
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-[10px] font-black text-monchito-purple uppercase tracking-widest">Catálogo</th>
                                    <th className="px-2 py-3 border-r border-monchito-purple/10 text-center text-[10px] font-black text-monchito-purple uppercase tracking-widest w-12">Cant</th>
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
                                                                type="text"
                                                                inputMode="decimal"
                                                                className="h-7 w-16 text-right text-xs font-bold border border-slate-200 rounded-lg px-1 focus:ring-1 focus:ring-monchito-purple outline-none hide-spinner"
                                                                value={item.total === 0 ? '' : item.total}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                                                    const newItems = [...formik.values.brandItems]
                                                                    const numVal = val === '' ? 0 : Number(val)
                                                                    newItems[idx] = { ...newItems[idx], total: numVal }
                                                                    if (Number(newItems[idx].deposit || 0) > numVal) newItems[idx].deposit = numVal;
                                                                    formik.setFieldValue('brandItems', newItems)
                                                                }}
                                                                onKeyDown={(e) => handleTableKeyDown(e, idx, 'total')}
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
                                                                type="text"
                                                                inputMode="decimal"
                                                                placeholder="0.00"
                                                                className="h-7 w-16 text-right text-xs font-bold border border-slate-200 rounded-lg px-1 focus:ring-1 focus:ring-emerald-500 outline-none text-emerald-600 hide-spinner"
                                                                value={item.deposit === 0 ? '' : item.deposit}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                                                    const numVal = val === '' ? 0 : Number(val);
                                                                    const newItems = [...formik.values.brandItems];
                                                                    const finalVal = Math.min(numVal, Number(newItems[idx].total || 0));
                                                                    newItems[idx] = { ...newItems[idx], deposit: finalVal };
                                                                    formik.setFieldValue('brandItems', newItems);
                                                                }}
                                                                onKeyDown={(e) => handleTableKeyDown(e, idx, 'deposit')}
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
                                                            className="h-7 w-full text-xs border border-slate-200 rounded-lg px-2 pr-8 font-medium focus:ring-1 focus:ring-monchito-purple outline-none"
                                                            value={item.possibleDeliveryDate}
                                                            onChange={(e) => {
                                                                const newItems = [...formik.values.brandItems]
                                                                newItems[idx] = { ...newItems[idx], possibleDeliveryDate: e.target.value }
                                                                formik.setFieldValue('brandItems', newItems)
                                                            }}
                                                            onKeyDown={(e) => handleTableKeyDown(e, idx, 'possibleDeliveryDate')}
                                                            data-row-index={idx}
                                                            data-field-name="possibleDeliveryDate"
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
                        <div className="relative flex-1 group">
                            <textarea
                                {...formik.getFieldProps('notes')}
                                className="w-full h-12 p-2 pr-10 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-monchito-purple outline-none resize-none transition-all"
                                placeholder="Notas adicionales sobre el pedido..."
                                data-nav="notes"
                                onKeyDown={e => handleHeaderKeyDown(e, 'notes')}
                            />
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={handleSaveNotes}
                                    disabled={isSubmitting}
                                    className="absolute right-2 top-2 p-1.5 text-monchito-purple hover:bg-monchito-purple/10 rounded-md transition-colors disabled:opacity-50"
                                    title="Guardar observaciones"
                                >
                                    <Save className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {!isEditing ? (
                            <AsyncButton
                                type="button"
                                onClick={handleMainSave}
                                onKeyDown={e => handleHeaderKeyDown(e, 'saveButton')}
                                data-nav="saveButton"
                                className="shrink-0 bg-monchito-purple hover:bg-monchito-purple/90 font-bold px-8 h-12"
                                isLoading={isSubmitting}
                            >
                                <Plus className="h-4 w-4 mr-2" /> 
                                Guardar Recibo
                            </AsyncButton>
                        ) : (
                            <AsyncButton
                                type="button"
                                onClick={handlePrintReceipt}
                                onKeyDown={e => handleHeaderKeyDown(e, 'printButton')}
                                data-nav="printButton"
                                className="shrink-0 bg-monchito-purple hover:bg-monchito-purple/90 font-bold px-8 h-12"
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
                expectedAmount={totalRowDeposit}
                initialAmount={totalRowDeposit}
                lockAmount={totalRowDeposit > 0}
                forceExactAmount={true}
                saveWithZeroPermission="orders.save_with_zero_deposit"
            />

            {/* Modal de Bloqueo por Concurrencia (DESHABILITADO) */}

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
                                possibleDeliveryDate: formatDateSafe(updatedOrder.possibleDeliveryDate) || original.possibleDeliveryDate,
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

